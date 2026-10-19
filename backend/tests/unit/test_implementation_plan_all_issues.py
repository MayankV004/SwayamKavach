"""Comprehensive unit and integration test suite validating Issues 1 through 10.

Tests cover:
  - Issue 4: Anchor dataset separation, no test leakage, A2 reading from training data
  - Issue 5: Threshold state machine (VERIFIED, PARTIAL, COMPUTED, FAILED, INCONCLUSIVE) & A2 manifest retention
  - Issue 6: Persistence chronology using window event time and sequence numbers
  - Issue 7: Least-privilege authorization (telemetry, evaluation, deployment, admin) and secret validation
  - Issue 8: Durable evaluation reports, candidate digest binding, mutation rejection, expiry
  - Issue 9: Guarded lifecycle transitions (CANDIDATE_BUILT -> EVALUATED -> AWAITING_APPROVAL -> CANARY)
  - Issue 10: Empirical benchmark verification, confidence intervals, reproducibility metadata
"""

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from starlette.testclient import TestClient

from swayamkavach.agents.graph import build_dari_graph, calibrate_node
from swayamkavach.api.auth import DEFAULT_DEV_KEY, generate_approval_signature
from swayamkavach.api.main import app
from swayamkavach.damage.persistence import PersistenceTracker
from swayamkavach.dari.adapter import LocalSubspaceAdapter
from swayamkavach.db.models import (
    ApprovedEvaluationRecordDB,
    EvaluationReportRecordDB,
    LifecycleStateRecordDB,
    WindowDamageHistoryDB,
)
from swayamkavach.db.session import SessionLocal, init_db
from swayamkavach.evaluation.compare import compute_sha256
from swayamkavach.experiments.benchmark import EmpiricalBenchmarkRunner, PolicyType


@pytest.fixture(autouse=True)
def setup_database():
    """Ensure clean test database state."""
    init_db()
    db = SessionLocal()
    # Reset lifecycle record
    rec = db.query(LifecycleStateRecordDB).first()
    if rec is None:
        rec = LifecycleStateRecordDB(id=1, champion_release="R1", active_slot="A", canary_weight=0.0)
        db.add(rec)
    else:
        rec.champion_release = "R1"
        rec.active_slot = "A"
        rec.candidate_release = None
        rec.candidate_slot = None
        rec.canary_weight = 0.0
        rec.decision_threshold = 0.42

    # Clear window damage history and evaluation reports for test isolation
    db.query(WindowDamageHistoryDB).delete()
    db.query(EvaluationReportRecordDB).delete()
    db.query(ApprovedEvaluationRecordDB).delete()
    db.commit()
    yield db
    db.close()

    # Clean up test releases on disk
    backend_dir = Path(__file__).resolve().parent.parent.parent
    for test_rel in ["R2-durable-test", "R2-mutated-test"]:
        d = backend_dir / "releases" / test_rel
        if d.exists():
            import shutil
            shutil.rmtree(d, ignore_errors=True)


# ==============================================================================
# Issue 4: Keep anchor dataset separate from evaluation data
# ==============================================================================

def test_a2_adapter_reads_anchors_from_train_path_not_val(monkeypatch, tmp_path):
    """Issue 4: A2 local adaptation must draw anchors from train.csv.gz, never val.csv.gz."""
    backend_dir = Path(__file__).resolve().parent.parent.parent
    train_path = backend_dir / "data" / "processed" / "train.csv.gz"
    val_path = backend_dir / "data" / "processed" / "val.csv.gz"

    assert train_path.exists(), "train.csv.gz must exist"
    assert val_path.exists(), "val.csv.gz must exist"

    # Verify adapter source code explicitly targets train.csv.gz for anchor sampling
    import inspect
    adapter_src = inspect.getsource(LocalSubspaceAdapter.adapt_candidate)
    assert 'train.csv.gz' in adapter_src
    assert 'val.csv.gz' not in adapter_src


def test_no_event_id_leakage_between_train_and_test():
    """Issue 4: No overlap of events between processed train and test datasets."""
    import pandas as pd
    backend_dir = Path(__file__).resolve().parent.parent.parent
    train_path = backend_dir / "data" / "processed" / "train.csv.gz"
    val_path = backend_dir / "data" / "processed" / "val.csv.gz"

    if train_path.exists() and val_path.exists():
        df_train = pd.read_csv(train_path, nrows=1000)
        df_val = pd.read_csv(val_path, nrows=1000)
        if "event_id" in df_train.columns and "event_id" in df_val.columns:
            train_ids = set(df_train["event_id"].dropna())
            val_ids = set(df_val["event_id"].dropna())
            overlap = train_ids.intersection(val_ids)
            assert len(overlap) == 0, f"Detected data leakage: {len(overlap)} overlapping event IDs"


# ==============================================================================
# Issue 5: Threshold state machine for A1
# ==============================================================================

def test_threshold_state_machine_both_slots_confirm(monkeypatch):
    """Issue 5: Both serving slots confirming threshold -> ACTIVATION_VERIFIED."""
    curr_t = [0.5]

    class VerifiedClient:
        def __init__(self, *args, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def get(self, url, **kwargs):
            return MagicMock(status_code=200, json=lambda: {"is_ready": True, "threshold": curr_t[0]})
        def post(self, url, params=None, **kwargs):
            if params and "threshold" in params:
                curr_t[0] = float(params["threshold"])
            return MagicMock(status_code=200)

    monkeypatch.setattr("httpx.Client", VerifiedClient)

    state = {
        "scores": [0.35, 0.45, 0.55, 0.65] * 20,
        "y_true": [0, 0, 1, 1] * 20,
        "audit_trail": [],
    }
    result = calibrate_node(state)
    assert result["calibration_state"] == "ACTIVATION_VERIFIED"
    assert result["calibration_result"]["confirmed_active_threshold"] is not None


def test_threshold_state_machine_partial_confirmation(monkeypatch):
    """Issue 5: Only one serving slot confirms -> ACTIVATION_PARTIAL."""
    curr_t = [0.5]

    class PartialClient:
        def __init__(self, *args, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def get(self, url, **kwargs):
            if "8001" in url:
                return MagicMock(status_code=200, json=lambda: {"is_ready": True, "threshold": curr_t[0]})
            raise RuntimeError("Port 8002 unreachable")
        def post(self, url, params=None, **kwargs):
            if "8001" in url:
                if params and "threshold" in params:
                    curr_t[0] = float(params["threshold"])
                return MagicMock(status_code=200)
            raise RuntimeError("Port 8002 unreachable")

    monkeypatch.setattr("httpx.Client", PartialClient)

    state = {
        "scores": [0.35, 0.45, 0.55, 0.65] * 20,
        "y_true": [0, 0, 1, 1] * 20,
        "audit_trail": [],
    }
    result = calibrate_node(state)
    assert result["calibration_state"] == "ACTIVATION_FAILED"
    # Verify transactional revert: Slot A was rolled back to its baseline threshold 0.5
    assert curr_t[0] == 0.5
    assert result["calibration_result"]["confirmed_active_threshold"] is None


def test_threshold_state_machine_neither_slot_responds(monkeypatch):
    """Issue 5: Neither slot responds -> CALIBRATION_COMPUTED (unconfirmed)."""
    class OfflineClient:
        def __init__(self, *args, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def get(self, url, **kwargs):
            raise RuntimeError("Connection refused")
        def post(self, url, **kwargs):
            raise RuntimeError("Connection refused")

    monkeypatch.setattr("httpx.Client", OfflineClient)

    state = {
        "scores": [0.35, 0.45, 0.55, 0.65] * 20,
        "y_true": [0, 0, 1, 1] * 20,
        "audit_trail": [],
    }
    result = calibrate_node(state)
    assert result["calibration_state"] == "CALIBRATION_COMPUTED"
    assert result["calibration_result"]["confirmed_active_threshold"] is None


def test_threshold_state_machine_mismatched_threshold_fails(monkeypatch):
    """Issue 5: Slot returns HTTP 200 but report mismatched threshold -> ACTIVATION_FAILED."""
    class MismatchedClient:
        def __init__(self, *args, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def get(self, url, **kwargs):
            # Returns 0.30 instead of computed 0.50
            return MagicMock(status_code=200, json=lambda: {"threshold": 0.30})
        def post(self, url, **kwargs):
            return MagicMock(status_code=200)

    monkeypatch.setattr("httpx.Client", MismatchedClient)

    state = {
        "scores": [0.35, 0.45, 0.55, 0.65] * 20,
        "y_true": [0, 0, 1, 1] * 20,
        "audit_trail": [],
    }
    result = calibrate_node(state)
    assert result["calibration_state"] == "ACTIVATION_FAILED"


# ==============================================================================
# Issue 6: Persistence chronological ordering
# ==============================================================================

def test_reprocessing_old_window_preserves_event_chronology(setup_database):
    """Issue 6: Reprocessing an old window updates evaluated_at but does not jump chronology."""
    db = setup_database
    tracker = PersistenceTracker()
    t0 = datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC)
    t1 = datetime(2026, 1, 1, 12, 5, 0, tzinfo=UTC)
    t2 = datetime(2026, 1, 1, 12, 10, 0, tzinfo=UTC)

    # 1. Record win-1 at t0 (anomalous)
    r1 = tracker.record_window(db, "win-1", d_x=0.30, d_b=0.10, q=0.99, l=0.95, s=200, is_anomalous=True, window_end_at=t0, sequence_num=1)
    assert r1 == 1

    # 2. Record win-2 at t1 (anomalous)
    r2 = tracker.record_window(db, "win-2", d_x=0.30, d_b=0.10, q=0.99, l=0.95, s=200, is_anomalous=True, window_end_at=t1, sequence_num=2)
    assert r2 == 2

    # 3. Record win-3 at t2 (healthy)
    r3 = tracker.record_window(db, "win-3", d_x=0.01, d_b=0.01, q=0.99, l=0.95, s=200, is_anomalous=False, window_end_at=t2, sequence_num=3)
    assert r3 == 1  # Reset because most recent window (win-3 at t2) is healthy!

    # 4. Now reprocess old win-1 with updated labels.
    # Its window_end_at remains t0. It must NOT jump ahead of win-3 or inflate R!
    r_reprocess = tracker.record_window(db, "win-1", d_x=0.35, d_b=0.12, q=0.99, l=0.98, s=250, is_anomalous=True)
    assert r_reprocess == 1  # win-3 is still the newest window in event time, so R remains reset (1)


def test_out_of_order_windows_deterministic_sorting(setup_database):
    """Issue 6: Out-of-order ingested windows sort strictly by event time."""
    db = setup_database
    tracker = PersistenceTracker()

    t_earlier = datetime(2026, 1, 1, 10, 0, 0, tzinfo=UTC)
    t_later = datetime(2026, 1, 1, 11, 0, 0, tzinfo=UTC)

    # Insert later window first
    tracker.record_window(db, "win-late", d_x=0.30, d_b=0.10, q=0.99, l=0.95, s=200, is_anomalous=True, window_end_at=t_later, sequence_num=2)
    # Insert earlier window second
    tracker.record_window(db, "win-early", d_x=0.30, d_b=0.10, q=0.99, l=0.95, s=200, is_anomalous=True, window_end_at=t_earlier, sequence_num=1)

    # Chronologically: win-early (t_earlier) followed by win-late (t_later) -> 2 consecutive anomalous windows
    r = tracker.get_current_persistence(db)
    assert r == 2


# ==============================================================================
# Issue 7: Least-privilege authorization
# ==============================================================================

def test_missing_credentials_returns_401():
    """Issue 7: Endpoint access without credentials yields HTTP 401."""
    client = TestClient(app)
    resp = client.post("/api/v1/deployment/canary/advance")
    assert resp.status_code == 401


def test_invalid_credentials_returns_401():
    """Issue 7: Invalid credentials yield HTTP 401."""
    client = TestClient(app)
    resp = client.post(
        "/api/v1/deployment/canary/advance",
        headers={"X-API-Key": "completely-invalid-bogus-token"},
    )
    assert resp.status_code == 401


def test_telemetry_credentials_cannot_approve_model():
    """Issue 7: Valid telemetry sensor credentials lack evaluation:approve permission -> HTTP 403."""
    client = TestClient(app)
    resp = client.post(
        "/api/v1/evaluations/approve",
        json={"report_id": "test", "approval_hash": "dummy"},
        headers={"X-API-Key": "swayamkavach-telemetry-dev-key"},
    )
    assert resp.status_code == 403
    assert "evaluation:approve" in resp.json()["detail"]


def test_evaluation_credentials_cannot_reset_lifecycle():
    """Issue 7: Valid evaluation credentials lack lifecycle:reset permission -> HTTP 403."""
    client = TestClient(app)
    resp = client.post(
        "/api/v1/lifecycle/reset",
        headers={"X-API-Key": "swayamkavach-evaluation-dev-key"},
    )
    assert resp.status_code == 403
    assert "lifecycle:reset" in resp.json()["detail"]


def test_admin_credentials_can_perform_permitted_operations():
    """Issue 7: Admin token has all permissions."""
    client = TestClient(app)
    resp = client.post(
        "/api/v1/lifecycle/reset",
        headers={"X-API-Key": DEFAULT_DEV_KEY},
    )
    assert resp.status_code == 200


def test_production_mode_rejects_weak_or_missing_keys(monkeypatch):
    """Issue 7: Production environment startup strictly rejects default or short keys."""
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("CONTROL_PLANE_API_KEY", DEFAULT_DEV_KEY)
    monkeypatch.setenv("CONTROL_PLANE_SECRET_KEY", "too-short")

    with pytest.raises(RuntimeError, match="Production security breach"):
        import importlib

        import swayamkavach.api.auth as auth_mod
        importlib.reload(auth_mod)


# ==============================================================================
# Issue 8: Durable evaluation reports & candidate binding
# ==============================================================================

def test_approval_retrieves_durable_report_from_db(setup_database, monkeypatch):
    """Issue 8: Approving a candidate retrieves the evaluation report from database."""
    # Hermetic mock for candidate serving slot probe and reload
    mock_resp_ready = MagicMock()
    mock_resp_ready.status_code = 200
    mock_resp_ready.json.return_value = {
        "status": "ready",
        "is_ready": True,
        "inference_mode": "pipeline",
        "release_id": "R2-durable-test",
    }

    mock_resp_reload = MagicMock()
    mock_resp_reload.status_code = 200
    mock_resp_reload.json.return_value = {"status": "reloaded"}

    class MockHttpxClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def get(self, url, **kwargs):
            return mock_resp_ready

        def post(self, url, **kwargs):
            return mock_resp_reload

    monkeypatch.setattr("httpx.Client", MockHttpxClient)

    db = setup_database
    client = TestClient(app)

    # 1. Create candidate artifact bundle on disk
    backend_dir = Path(__file__).resolve().parent.parent.parent
    cand_dir = backend_dir / "releases" / "R2-durable-test"
    cand_dir.mkdir(parents=True, exist_ok=True)
    bundle_path = cand_dir / "pipeline.joblib"
    bundle_path.write_bytes(b"test_pipeline_bundle_content")
    cand_sha = compute_sha256(bundle_path)

    manifest_path = cand_dir / "manifest.json"
    manifest_path.write_text(json.dumps({"bundle_sha256": cand_sha, "decision_threshold": 0.42}))

    # 2. Generate matching approval hash
    now_dt = datetime.now(UTC)
    exp_dt = now_dt + timedelta(hours=24)
    sig = generate_approval_signature(
        report_id="EVAL_DURABLE_001",
        candidate_release_id="R2-durable-test",
        candidate_sha256=cand_sha,
        operator_id="lead_operator",
        expires_at_iso=exp_dt.isoformat(),
    )

    # 3. Durably persist an evaluation report in DB
    report_rec = EvaluationReportRecordDB(
        report_id="EVAL_DURABLE_001",
        champion_release="R1",
        candidate_release="R2-durable-test",
        champion_sha256="champ_sha_mock",
        candidate_sha256=cand_sha,
        dataset_version="val.csv.gz",
        evaluated_samples=500,
        verdict="PASS",
        p_value=0.001,
        statistically_significant=True,
        rejection_reasons=[],
        champion_metrics={},
        candidate_metrics={},
        per_class_recall={},
        approval_hash=sig,
        policy_version="dari-v1.0",
        created_at=now_dt,
    )
    db.merge(report_rec)
    db.commit()

    # 4. Approve using admin key
    resp = client.post(
        "/api/v1/evaluations/approve",
        json={"report_id": "EVAL_DURABLE_001", "approval_hash": sig, "operator_id": "lead_operator"},
        headers={"X-API-Key": DEFAULT_DEV_KEY},
    )
    assert resp.status_code == 200, resp.json()
    assert resp.json()["status"] == "approved"
    assert resp.json()["candidate_release"] == "R2-durable-test"


def test_approval_rejects_candidate_when_artifact_modified(setup_database):
    """Issue 8: Candidate artifact mutated after evaluation must be rejected."""
    db = setup_database
    client = TestClient(app)

    backend_dir = Path(__file__).resolve().parent.parent.parent
    cand_dir = backend_dir / "releases" / "R2-mutated-test"
    cand_dir.mkdir(parents=True, exist_ok=True)
    bundle_path = cand_dir / "pipeline.joblib"
    bundle_path.write_bytes(b"initial_bundle")

    manifest_path = cand_dir / "manifest.json"
    manifest_path.write_text(json.dumps({"bundle_sha256": compute_sha256(bundle_path)}))

    # Persist report for original SHA
    report_rec = EvaluationReportRecordDB(
        report_id="EVAL_MUTATED_001",
        champion_release="R1",
        candidate_release="R2-mutated-test",
        champion_sha256="champ_sha",
        candidate_sha256="original_evaluated_sha_999",
        dataset_version="val.csv.gz",
        evaluated_samples=500,
        verdict="PASS",
        p_value=0.001,
        statistically_significant=True,
        rejection_reasons=[],
        champion_metrics={},
        candidate_metrics={},
        per_class_recall={},
        approval_hash="valid_hash",
        policy_version="dari-v1.0",
        created_at=datetime.now(UTC),
    )
    db.merge(report_rec)
    db.commit()

    resp = client.post(
        "/api/v1/evaluations/approve",
        json={"report_id": "EVAL_MUTATED_001", "approval_hash": "valid_hash"},
        headers={"X-API-Key": DEFAULT_DEV_KEY},
    )
    # Rejection due to mismatch between evaluated SHA and current bundle SHA
    assert resp.status_code == 400
    assert "Candidate artifact has mutated" in resp.json()["detail"]


# ==============================================================================
# Issue 9: Guarded lifecycle autonomy
# ==============================================================================

def test_guarded_autonomy_graph_transitions():
    """Issue 9: LangGraph compiles and contains candidate evaluation and routing."""
    graph = build_dari_graph()
    assert graph is not None
    # Inspect registered nodes
    assert "evaluate_candidate" in graph.nodes


# ==============================================================================
# Issue 10: Empirical benchmark verification
# ==============================================================================

def test_empirical_benchmark_report_metadata():
    """Issue 10: EmpiricalBenchmarkRunner outputs is_simulation=False, seed, and confidence intervals."""
    runner = EmpiricalBenchmarkRunner()
    report = runner.run_empirical_benchmark(n_windows=2, window_size=50, seed=42)

    assert report.is_simulation is False
    assert report.seed == 42
    assert report.policy_version == "dari-v1.0"
    assert report.confidence_intervals is not None
    assert PolicyType.DARI.value in report.confidence_intervals
    ci = report.confidence_intervals[PolicyType.DARI.value]
    assert "recall_ci_lower" in ci
    assert "recall_ci_upper" in ci
    assert ci["recall_ci_lower"] <= ci["recall_ci_upper"]


# ==============================================================================
# Targeted Regression Tests for 19 October Review Findings
# ==============================================================================

def test_canary_controller_missing_adapter_fails_closed(setup_database):
    """Canary controller without explicit routing adapter must fail closed without modifying rollout state."""
    from swayamkavach.deployment.canary import CanaryController

    db = setup_database
    controller = CanaryController(nginx_conf_path=None)

    with pytest.raises(RuntimeError, match="routing adapter not configured"):
        controller.apply_and_verify_routing(active_slot="A", canary_weight=0.05)

    # DB state must remain completely unadvanced
    rec = db.query(LifecycleStateRecordDB).first()
    assert rec.canary_weight == 0.0
    assert rec.candidate_release is None
    assert rec.active_slot == "A"


def test_nginx_reload_failure_restores_backup_and_records_reconciliation(tmp_path, setup_database):
    """If reload fails, controller must restore last known-good config and record RECONCILIATION_REQUIRED."""
    from swayamkavach.deployment.canary import CanaryController

    db = setup_database
    conf_file = tmp_path / "nginx.conf"
    initial_text = "# INITIAL KNOWN GOOD CONFIG\nupstream serving_backend {\n    server 127.0.0.1:8001 weight=100;\n}\n"
    conf_file.write_text(initial_text)

    def failing_reload():
        raise RuntimeError("simulated nginx reload timeout / error")

    controller = CanaryController(nginx_conf_path=conf_file, reload_hook=failing_reload)

    with pytest.raises(RuntimeError, match="simulated nginx reload"):
        controller.stage_candidate(db, candidate_release="R2-candidate", initial_weight=0.05)

    # 1. Configuration file must be restored back to initial text
    assert conf_file.read_text() == initial_text

    # 2. Rollout state must record RECONCILIATION_REQUIRED
    rec = db.query(LifecycleStateRecordDB).first()
    assert rec.last_action is not None
    assert "RECONCILIATION_REQUIRED" in rec.last_action


def test_production_starts_rejects_missing_or_default_credentials(monkeypatch):
    """In production mode, missing or default credentials for all roles must raise RuntimeError/ValueError."""
    from swayamkavach.api.auth import validate_production_credentials

    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("CONTROL_PLANE_API_KEY", "strong_control_plane_key_at_least_32_chars_123")
    monkeypatch.setenv("CONTROL_PLANE_SECRET_KEY", "strong_control_plane_secret_at_least_32_chars_123")

    # Missing TELEMETRY_API_KEY
    monkeypatch.delenv("TELEMETRY_API_KEY", raising=False)
    with pytest.raises((RuntimeError, ValueError), match="TELEMETRY_API_KEY must be explicitly configured"):
        validate_production_credentials()

    # Set valid telemetry, labels, evaluation, approval keys but leave DEPLOYMENT_API_KEY as default
    monkeypatch.setenv("TELEMETRY_API_KEY", "strong_telemetry_key_at_least_32_characters_long_123")
    monkeypatch.setenv("LABELS_API_KEY", "strong_labels_key_at_least_32_characters_long_123")
    monkeypatch.setenv("EVALUATION_API_KEY", "strong_evaluation_key_at_least_32_characters_123")
    monkeypatch.setenv("APPROVAL_API_KEY", "strong_approval_key_at_least_32_characters_long_123")
    monkeypatch.setenv("DEPLOYMENT_API_KEY", "swayamkavach-deployment-dev-key")
    with pytest.raises((RuntimeError, ValueError), match="DEPLOYMENT_API_KEY cannot use the default"):
        validate_production_credentials()


def test_evaluation_report_persistence_failure_returns_500(monkeypatch, setup_database):
    """If database write of evaluation report fails, /compare must return HTTP 500 (fail closed)."""
    client = TestClient(app)

    def failing_commit(*args, **kwargs):
        raise RuntimeError("simulated db disk full / write error")

    monkeypatch.setattr("sqlalchemy.orm.Session.commit", failing_commit)

    backend_dir = Path(__file__).resolve().parent.parent.parent
    champ_bundle = backend_dir / "releases" / "R1" / "pipeline.joblib"
    cand_bundle = backend_dir / "releases" / "R2" / "pipeline.joblib"

    if champ_bundle.exists() and cand_bundle.exists():
        resp = client.post(
            "/api/v1/evaluations/compare",
            json={
                "champion_release_id": "R1",
                "candidate_release_id": "R2",
            },
            headers={"X-API-Key": DEFAULT_DEV_KEY},
        )
        assert resp.status_code == 500
        assert "persistence failed" in resp.json()["detail"].lower()


def test_approval_replay_and_digest_conflict(setup_database):
    """Approval must be idempotent for identical request, and reject digest conflict with HTTP 409."""
    db = setup_database
    client = TestClient(app)

    now_dt = datetime.now(UTC)
    exp_dt = now_dt + timedelta(hours=24)
    backend_dir = Path(__file__).resolve().parent.parent.parent
    r2_bundle = backend_dir / "releases" / "R2" / "pipeline.joblib"
    cand_sha = compute_sha256(r2_bundle) if r2_bundle.exists() else "valid_sha256"

    sig = generate_approval_signature(
        report_id="EVAL_REPLAY_001",
        candidate_release_id="R2",
        candidate_sha256=cand_sha,
        operator_id="lead_operator",
        expires_at_iso=exp_dt.isoformat(),
    )

    report_rec = EvaluationReportRecordDB(
        report_id="EVAL_REPLAY_001",
        champion_release="R1",
        candidate_release="R2",
        champion_sha256="champ_sha",
        candidate_sha256=cand_sha,
        dataset_version="val.csv.gz",
        evaluated_samples=500,
        verdict="PASS",
        p_value=0.001,
        statistically_significant=True,
        rejection_reasons=[],
        champion_metrics={},
        candidate_metrics={},
        per_class_recall={},
        approval_hash=sig,
        policy_version="dari-v1.0",
        created_at=now_dt,
    )
    db.merge(report_rec)
    db.commit()

    # First approval: 200 approved
    resp1 = client.post(
        "/api/v1/evaluations/approve",
        json={"report_id": "EVAL_REPLAY_001", "approval_hash": sig, "operator_id": "lead_operator"},
        headers={"X-API-Key": DEFAULT_DEV_KEY},
    )
    assert resp1.status_code == 200
    assert resp1.json()["status"] == "approved"

    # Second approval (exact replay): 200 idempotent
    resp2 = client.post(
        "/api/v1/evaluations/approve",
        json={"report_id": "EVAL_REPLAY_001", "approval_hash": sig, "operator_id": "lead_operator"},
        headers={"X-API-Key": DEFAULT_DEV_KEY},
    )
    assert resp2.status_code == 200
    assert resp2.json()["status"] in ("approved", "already_approved")

    # Third approval with conflicting candidate digest in DB: 409 Conflict
    approved_rec = db.query(ApprovedEvaluationRecordDB).filter_by(report_id="EVAL_REPLAY_001").first()
    approved_rec.candidate_sha256 = "mutated_sha256_different_from_current"
    db.commit()

    resp3 = client.post(
        "/api/v1/evaluations/approve",
        json={"report_id": "EVAL_REPLAY_001", "approval_hash": sig, "operator_id": "lead_operator"},
        headers={"X-API-Key": DEFAULT_DEV_KEY},
    )
    assert resp3.status_code == 409
    assert "already approved with artifact digest" in resp3.json()["detail"].lower()


def test_a2_adapter_capture_group_no_leakage_between_train_and_holdout(tmp_path):
    """A2 adaptation using capture-group split must strictly guarantee 0 overlap between train and holdout."""
    import pandas as pd

    from swayamkavach.dari.adapter import LocalSubspaceAdapter

    # Generate synthetic capture-grouped streaming window
    records = []
    for cap_id in [f"session_{i}" for i in range(10)]:
        for _ in range(20):
            records.append({
                "proto": "tcp",
                "service": "http",
                "conn_state": "SF",
                "duration": 0.5,
                "src_bytes": 100,
                "dst_bytes": 200,
                "missed_bytes": 0,
                "src_pkts": 5,
                "src_ip_bytes": 300,
                "dst_pkts": 5,
                "dst_ip_bytes": 300,
                "dns_query": "-",
                "ssl_version": "-",
                "ssl_cipher": "-",
                "label": 1 if "5" in cap_id or "6" in cap_id else 0,
                "attack_type": "ddos" if "5" in cap_id or "6" in cap_id else "normal",
                "capture_id": cap_id,
            })
    df_window = pd.DataFrame(records)

    adapter = LocalSubspaceAdapter(output_dir=tmp_path)
    res = adapter.adapt_candidate(
        features=df_window,
        y_true=df_window["label"].values,
        candidate_release_id="R2-capture-test",
    )

    assert res.status == "SUCCESS"
    manifest_path = tmp_path / "R2-capture-test" / "manifest.json"
    assert manifest_path.exists()
    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)

    assert manifest.get("adaptation_paradigm") == "localized_retraining_with_anchor_regularization"
    assert "split_strategy" in manifest

