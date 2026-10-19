"""Comprehensive verification tests for review findings and invariant fixes:

  - Finding 1: A2 Localized Subspace Adaptation execution in remediation graph.
  - Finding 2: Live persistence tracking and temporal history (R calculation and reset).
  - Finding 3: Control-plane authorization, token tampering, and cryptographic approval binding.
  - Finding 4: ThresholdCalibrator no-evidence protection (INSUFFICIENT_DATA, no synthetic falsification).
  - Finding 5: DARIPolicyConfig alignment ($S_min=1000$ for A3, A1 gating on severe covariate shift).
  - Engineering fixes: Model-serving readiness failure on missing bundle, canary health gate enforcement,
    and monitoring window nullable label alignment.
"""

from datetime import UTC, datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from starlette.testclient import TestClient

from schemas.lifecycle import DamageFingerprint, RepairAction
from swayamkavach.api.auth import (
    DEFAULT_DEV_KEY,
    generate_approval_signature,
    verify_approval_signature,
    verify_control_plane_token,
)
from swayamkavach.damage.persistence import PersistenceTracker
from swayamkavach.dari.adapter import LocalSubspaceAdapter
from swayamkavach.dari.calibrator import ThresholdCalibrator
from swayamkavach.dari.policy_config import DARIPolicyConfig
from swayamkavach.dari.selector import DARISolver
from swayamkavach.db.models import (
    ApprovedEvaluationRecordDB,
    GroundTruthLabelRecordDB,
    LifecycleStateRecordDB,
    PredictionRecordDB,
    WindowDamageHistoryDB,
)
from swayamkavach.db.session import SessionLocal, init_db
from swayamkavach.deployment.canary import CanaryController
from swayamkavach.monitoring.window import WindowSelector


@pytest.fixture(autouse=True)
def setup_clean_db():
    init_db()
    db = SessionLocal()
    # Clean up state
    db.query(WindowDamageHistoryDB).delete()
    db.query(ApprovedEvaluationRecordDB).delete()
    db.query(PredictionRecordDB).delete()
    db.query(GroundTruthLabelRecordDB).delete()
    db.commit()
    yield db
    db.close()


# --------------------------------------------------------------------------
# Finding 1 Tests: A2 Local Subspace Adaptation Node & Artifact
# --------------------------------------------------------------------------

def test_a2_adapter_generates_valid_candidate_release(tmp_path):
    """Verify LocalSubspaceAdapter trains on localized damaged slice and creates release artifact."""
    import joblib

    r1_dir = Path(__file__).resolve().parent.parent.parent / "releases" / "R1"
    champ_pipeline = joblib.load(r1_dir / "pipeline.joblib")

    # Synthetic window with 120 events
    rng = np.random.RandomState(42)
    data = {
        "duration": rng.exponential(1.0, 120),
        "src_bytes": rng.randint(50, 5000, 120),
        "dst_bytes": rng.randint(50, 5000, 120),
        "src_ip_bytes": rng.randint(50, 5000, 120),
        "dst_ip_bytes": rng.randint(50, 5000, 120),
        "src_pkts": rng.randint(1, 50, 120),
        "dst_pkts": rng.randint(1, 50, 120),
        "missed_bytes": np.zeros(120),
        "proto": ["tcp"] * 120,
        "service": ["http"] * 120,
        "conn_state": ["SF"] * 120,
        "label": [1] * 30 + [0] * 90,
    }
    df = pd.DataFrame(data)

    adapter = LocalSubspaceAdapter(releases_dir=tmp_path)
    result = adapter.adapt(base_pipeline=champ_pipeline, window_df=df)

    assert result.candidate_release_id.startswith("R2-adapt-")
    assert result.bundle_path.exists()
    assert result.manifest_path.exists()
    assert result.training_samples == 120
    assert result.status == "SUCCESS"


# --------------------------------------------------------------------------
# Finding 2 Tests: Persistence Tracking (R >= 2 for A3)
# --------------------------------------------------------------------------

def test_persistence_tracker_consecutive_increments_and_resets(setup_clean_db):
    """Verify R counts consecutive anomalous windows and resets upon nominal window."""
    db = setup_clean_db
    tracker = PersistenceTracker()

    # Window 1: Anomalous -> R=1
    r1 = tracker.record_window(db, window_id="win-1", d_x=0.30, d_b=0.10, q=0.98, l=0.95, s=200, is_anomalous=True)
    assert r1 == 1

    # Window 2: Anomalous -> R=2
    r2 = tracker.record_window(db, window_id="win-2", d_x=0.32, d_b=0.12, q=0.98, l=0.95, s=200, is_anomalous=True)
    assert r2 == 2

    # Window 3: Anomalous -> R=3
    r3 = tracker.record_window(db, window_id="win-3", d_x=0.35, d_b=0.11, q=0.98, l=0.95, s=200, is_anomalous=True)
    assert r3 == 3

    # Window 4: Nominal -> Resets R=1
    r4 = tracker.record_window(db, window_id="win-4", d_x=0.02, d_b=0.03, q=0.99, l=0.98, s=200, is_anomalous=False)
    assert r4 == 1

    # Window 5: Anomalous again -> R=1
    r5 = tracker.record_window(db, window_id="win-5", d_x=0.30, d_b=0.10, q=0.98, l=0.95, s=200, is_anomalous=True)
    assert r5 == 1


def test_persistence_tracker_idempotency_by_window_id(setup_clean_db):
    """Verify repeatedly recording the same window_id does not inflate persistence R."""
    db = setup_clean_db
    tracker = PersistenceTracker()

    # Window 1 recorded 5 times consecutively (e.g. repeated lifecycle poll)
    for _ in range(5):
        r = tracker.record_window(db, window_id="win-1", d_x=0.30, d_b=0.10, q=0.98, l=0.95, s=200, is_anomalous=True)
        assert r == 1  # Must NOT inflate to 2, 3, 4, 5!

    # Only when a distinct new window win-2 is observed does R become 2
    r2 = tracker.record_window(db, window_id="win-2", d_x=0.35, d_b=0.12, q=0.98, l=0.95, s=200, is_anomalous=True)
    assert r2 == 2

    # Polling win-2 again does NOT advance R to 3
    r2_repeat = tracker.record_window(db, window_id="win-2", d_x=0.35, d_b=0.12, q=0.98, l=0.95, s=200, is_anomalous=True)
    assert r2_repeat == 2


def test_a3_requires_persistence_r_at_least_2():
    """Verify DARI solver rejects A3 full retraining when R=1 (transient drift), selecting A0 or lowest feasible."""
    policy = DARIPolicyConfig(s_min_retrain=1000)
    solver = DARISolver(config=policy)

    # Severe damage with plenty of samples, but transient (R=1)
    transient_fp = DamageFingerprint(D_X=0.45, D_Y=0.20, D_B=0.10, Q=0.95, L=0.95, S=1200, R=1)
    sel_transient = solver.solve(transient_fp)
    assert RepairAction.A3 not in sel_transient.feasible_actions
    assert "R=1" in sel_transient.rejection_reasons.get(RepairAction.A3, "")

    # Persistent damage (R=2)
    persistent_fp = DamageFingerprint(D_X=0.45, D_Y=0.20, D_B=0.10, Q=0.95, L=0.95, S=1200, R=2)
    sel_persistent = solver.solve(persistent_fp)
    assert RepairAction.A3 in sel_persistent.feasible_actions
    assert sel_persistent.chosen_action == RepairAction.A3


# --------------------------------------------------------------------------
# Finding 3 Tests: Control-Plane Auth & HMAC Verification
# --------------------------------------------------------------------------

def test_control_plane_auth_verification():
    """Verify API key and Bearer token verification."""
    assert verify_control_plane_token(DEFAULT_DEV_KEY) is True
    assert verify_control_plane_token("wrong-secret-key") is False
    assert verify_control_plane_token(None) is False


def test_approval_signature_hmac_tampering_detection():
    """Verify HMAC signature detects tampering of candidate ID or expiry."""
    now = datetime.now(UTC)
    sig = generate_approval_signature(
        report_id="EVAL_001",
        candidate_release_id="R2-cand",
        candidate_sha256="abc123sha",
        operator_id="operator_1",
        expires_at_iso=now + timedelta(hours=24),
    )

    # Valid
    assert verify_approval_signature(
        signature=sig,
        report_id="EVAL_001",
        candidate_release_id="R2-cand",
        candidate_sha256="abc123sha",
        operator_id="operator_1",
        expires_at_iso=now + timedelta(hours=24),
    ) is True

    # Tampered release ID
    assert verify_approval_signature(
        signature=sig,
        report_id="EVAL_001",
        candidate_release_id="R2-tampered",
        candidate_sha256="abc123sha",
        operator_id="operator_1",
        expires_at_iso=now + timedelta(hours=24),
    ) is False


# --------------------------------------------------------------------------
# Finding 4 Tests: ThresholdCalibrator No-Evidence Safety
# --------------------------------------------------------------------------

def test_calibrator_empty_data_returns_insufficient_data():
    """Verify calibrator returns INSUFFICIENT_DATA and zero metrics on empty inputs (never fake 1.0)."""
    calibrator = ThresholdCalibrator()
    result = calibrator.calibrate(scores=[], labels=[])

    assert result.status == "INSUFFICIENT_DATA"
    assert result.meets_constraints is False
    assert result.recall == 0.0
    assert result.fpr == 0.0
    assert result.f1 == 0.0


def test_calibrator_single_class_returns_single_class_insufficient():
    """Verify calibrator handles single-class data without reporting perfect fake metrics."""
    calibrator = ThresholdCalibrator()
    scores = np.array([0.2, 0.4, 0.6, 0.8])
    labels = np.array([0, 0, 0, 0])  # No attack class present

    result = calibrator.calibrate(scores=scores, labels=labels)
    assert result.status == "SINGLE_CLASS_INSUFFICIENT"
    assert result.meets_constraints is False
    assert result.recall == 0.0


# --------------------------------------------------------------------------
# Finding 5 Tests: Safety Limits and Severe Covariate Shift Gating
# --------------------------------------------------------------------------

def test_solver_enforces_1000_sample_floor_for_a3():
    """Verify A3 requires at least 1,000 samples as documented in thesis."""
    policy = DARIPolicyConfig(s_min_retrain=1000, s_min_adapt=100)
    solver = DARISolver(config=policy)

    # 500 samples is enough for A2 (>=100) but NOT for A3 (<1000)
    fp = DamageFingerprint(D_X=0.45, D_Y=0.20, D_B=0.10, Q=0.95, L=0.95, S=500, R=2)
    sel = solver.solve(fp)

    assert RepairAction.A3 not in sel.feasible_actions
    assert "Sample count S=" in sel.rejection_reasons[RepairAction.A3]
    # A2 should be feasible
    assert RepairAction.A2 in sel.feasible_actions


def test_a1_rejected_under_severe_covariate_shift():
    """Verify threshold recalibration (A1) is rejected when feature corruption is severe (D_X >= 0.40)."""
    solver = DARISolver()

    # Severe covariate shift (D_X=0.45) with low boundary uncertainty (D_B=0.05)
    fp = DamageFingerprint(D_X=0.45, D_Y=0.15, D_B=0.05, Q=0.95, L=0.95, S=200, R=1)
    sel = solver.solve(fp)

    assert RepairAction.A1 not in sel.feasible_actions
    assert "Severe covariate shift" in sel.rejection_reasons[RepairAction.A1]


# --------------------------------------------------------------------------
# Model Serving Fallback Readiness Tests
# --------------------------------------------------------------------------

def test_model_serving_readiness_fails_when_bundle_missing():
    """Verify /readyz reports not ready when model bundle is absent unless heuristic fallback allowed."""
    from swayamkavach.serving.app import app as serving_app
    from swayamkavach.serving.app import load_model_bundle

    # Attempt load non-existent bundle
    load_model_bundle("non_existent_bundle_12345")
    client = TestClient(serving_app)

    ready_resp = client.get("/readyz")
    assert ready_resp.status_code == 503
    assert "Model bundle not loaded" in ready_resp.json()["detail"]

    # Restore R1 champion bundle
    load_model_bundle("R1")


# --------------------------------------------------------------------------
# Canary Progression Enforced Health Gate Tests
# --------------------------------------------------------------------------

def test_canary_advance_stage_blocked_on_health_gate_failure(setup_clean_db, monkeypatch):
    """Verify advance_stage executes immediate warm rollback if candidate violates SLA recall."""
    from unittest.mock import MagicMock

    mock_resp_ready = MagicMock()
    mock_resp_ready.status_code = 200
    mock_resp_ready.json.return_value = {"status": "ready", "is_ready": True, "inference_mode": "pipeline"}

    class MockHttpxClient:
        def __init__(self, *args, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def get(self, url, **kwargs):
            return mock_resp_ready

    monkeypatch.setattr("httpx.Client", MockHttpxClient)

    db = setup_clean_db
    controller = CanaryController()

    # Set up candidate staged at 5%
    rec = LifecycleStateRecordDB(
        id=1,
        champion_release="R1",
        active_slot="A",
        candidate_release="R2-degraded",
        candidate_slot="B",
        canary_weight=0.05,
    )
    db.merge(rec)
    db.commit()

    # Seed 15 degraded predictions where attack recall is only 40% (< 95% SLA)
    for i in range(15):
        event_id = f"ev-gate-{i}"
        pred = 1 if i < 6 else 0  # Only 6 / 15 attacks detected
        db.add(
            PredictionRecordDB(
                event_id=event_id,
                score=0.35,
                prediction=pred,
                release_id="R2-degraded",
                model_version="1.0",
                slot_id="B",
                predicted_at=datetime.now(UTC),
            )
        )
        db.add(
            GroundTruthLabelRecordDB(
                event_id=event_id,
                label=1,  # True attack
                attack_type="ddos",
                confidence=1.0,
                received_at=datetime.now(UTC),
            )
        )
    db.commit()

    # Advancing stage must fail and trigger warm rollback!
    with pytest.raises(ValueError, match="Canary progression blocked"):
        controller.advance_stage(db)

    # Verify rollback state
    state = controller.get_state(db)
    assert state.candidate_release is None
    assert state.canary_weight == 0.0
    assert "ROLLED_BACK" in state.last_reason


def test_canary_probe_connection_failure_fails_closed(setup_clean_db, monkeypatch):
    """Verify probe connection errors fail closed and trigger immediate warm rollback."""
    class MockFailingClient:
        def __init__(self, *args, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def get(self, url, **kwargs):
            raise ConnectionRefusedError("[Errno 111] Connection refused")

    monkeypatch.setattr("httpx.Client", MockFailingClient)

    db = setup_clean_db
    controller = CanaryController()

    rec = LifecycleStateRecordDB(
        id=1,
        champion_release="R1",
        active_slot="A",
        candidate_release="R2-unreachable",
        candidate_slot="B",
        canary_weight=0.05,
    )
    db.merge(rec)
    db.commit()

    with pytest.raises(ValueError, match="Canary progression blocked: Candidate slot B probe failed"):
        controller.advance_stage(db)

    state = controller.get_state(db)
    assert state.candidate_release is None
    assert state.canary_weight == 0.0
    assert "ROLLED_BACK" in state.last_reason


# --------------------------------------------------------------------------
# Monitoring Window Nullable Alignment & Label Coverage Tests
# --------------------------------------------------------------------------

def test_monitoring_window_preserves_nullable_alignment_and_coverage():
    """Verify WindowSelector preserves 1-to-1 nullable event alignment and computes label_coverage."""
    selector = WindowSelector(window_size=10, min_labeled_samples=2)

    events = [
        {"event_id": f"ev-{i}", "features": {"duration": 1.0, "src_bytes": 100}, "score": 0.5}
        for i in range(10)
    ]
    # Only 4 events have labels (ev-1, ev-3, ev-5, ev-7)
    labels = {
        "ev-1": 1,
        "ev-3": 0,
        "ev-5": 1,
        "ev-7": 0,
    }

    win = selector.build_window(events, labels, reference_threshold=0.42)
    assert win.sample_count == 10
    assert sum(1 for y in win.y_true if y is not None) == 4
    assert win.label_coverage == 0.40  # 4 / 10
    assert len(win.y_true) == 10
    assert win.y_true[0] is None
    assert win.y_true[1] == 1
    assert win.y_true[3] == 0


# --------------------------------------------------------------------------
# Empirical Benchmark Test
# --------------------------------------------------------------------------

def test_empirical_benchmark_runner_executes_on_real_dataset():
    """Verify EmpiricalBenchmarkRunner slices real validation data and computes empirical metrics."""
    from swayamkavach.experiments.benchmark import EmpiricalBenchmarkRunner

    runner = EmpiricalBenchmarkRunner()
    report = runner.run_empirical_benchmark(n_windows=2, window_size=100)
    assert report.is_simulation is False
    assert report.total_windows_evaluated == 2
    assert report.total_events_evaluated == 200
    assert "dari" in report.results
    assert "static_champion" in report.results
    assert "periodic_retraining" in report.results
    assert "retrain_all" in report.results
    assert report.results["dari"].cumulative_recall >= 0.0


# --------------------------------------------------------------------------
# Sensitive Endpoint Authentication and Authorization Tests
# --------------------------------------------------------------------------

def test_unauthenticated_sensitive_endpoints_rejected_401():
    """Verify sensitive mutation routes reject requests lacking control-plane credentials."""
    from starlette.testclient import TestClient
    from swayamkavach.api.main import app

    unauth_client = TestClient(app)

    # 1. Reset lifecycle
    resp_reset = unauth_client.post("/api/v1/lifecycle/reset")
    assert resp_reset.status_code == 401
    assert "Missing or invalid control-plane authorization credential" in resp_reset.json()["detail"]

    # 2. Ingest flow events batch
    resp_ingest = unauth_client.post(
        "/api/v1/ingestion/batches",
        json={"batch_id": "b1", "sensor_id": "s1", "schema_version": "v1", "extractor_id": "e1", "events": []},
    )
    assert resp_ingest.status_code == 401

    # 3. Ingest labels
    resp_labels = unauth_client.post(
        "/api/v1/labels",
        json={"batch_id": "b1", "labels": []},
    )
    assert resp_labels.status_code == 401

    # 4. Compare models
    resp_compare = unauth_client.post(
        "/api/v1/evaluations/compare",
        json={"candidate_release_id": "R2", "champion_release_id": "R1"},
    )
    assert resp_compare.status_code == 401


def test_production_env_blocks_default_dev_secrets(monkeypatch):
    """Verify server rejects default dev credentials when ENVIRONMENT=production."""
    import importlib
    import os
    import swayamkavach.api.auth as auth_mod

    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("CONTROL_PLANE_API_KEY", raising=False)
    monkeypatch.delenv("CONTROL_PLANE_SECRET_KEY", raising=False)

    with pytest.raises(RuntimeError, match="Production security breach"):
        importlib.reload(auth_mod)

    # Clean up environment reload
    monkeypatch.setenv("ENVIRONMENT", "development")
    importlib.reload(auth_mod)


def test_model_comparator_missing_labels_does_not_convert_to_benign():
    """Verify ModelComparator does not silently convert missing/NaN labels to benign class 0."""
    from unittest.mock import MagicMock
    from swayamkavach.evaluation.compare import ModelComparator, EvaluationVerdict

    comparator = ModelComparator(min_samples_for_pass=10)

    # DataFrame with 15 rows: only 4 validly labeled rows (2 attacks, 2 normal), 11 NaN labels
    val_df = pd.DataFrame({
        "duration": [1.0] * 15,
        "src_bytes": [100] * 15,
        "label": [1, 0, 1, 0] + [np.nan] * 11,
        "type": ["ddos", "normal", "ddos", "normal"] + [np.nan] * 11,
    })

    champ_mock = MagicMock()
    cand_mock = MagicMock()

    # Even though total rows=15, valid labeled samples=4 < min_samples_for_pass=10.
    # It must return INCONCLUSIVE rather than treating the 11 NaNs as class 0!
    report = comparator.compare(
        champion_pipeline=champ_mock,
        candidate_pipeline=cand_mock,
        val_df=val_df,
    )
    assert report.verdict == EvaluationVerdict.INCONCLUSIVE
    assert "missing/invalid labels excluded" in report.rejection_reasons[0]
    assert report.evaluated_samples == 4  # Valid labeled samples count, NOT 15!
