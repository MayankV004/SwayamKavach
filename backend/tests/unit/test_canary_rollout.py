import json
import shutil
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from starlette.testclient import TestClient

from swayamkavach.api.main import app
from swayamkavach.db.models import LifecycleStateRecordDB
from swayamkavach.db.session import SessionLocal, init_db
from swayamkavach.deployment.canary import CanaryController, RolloutStatus

TEST_RELEASES = [
    "R2-candidate",
    "R2-faulty",
    "R2-zero-evidence",
    "R2-all-benign",
    "R2-all-attack",
    "R2-nginx-missing",
    "R2-bad-reload",
    "R2-heuristic",
]


@pytest.fixture(autouse=True)
def setup_test_candidate_artifacts():
    """Ensure candidate artifacts exist on disk so controller pre-flight verification passes."""
    backend_dir = Path(__file__).resolve().parent.parent.parent
    r1_dir = backend_dir / "releases" / "R1"
    created_dirs = []
    for rel_id in TEST_RELEASES:
        rel_dir = backend_dir / "releases" / rel_id
        if not rel_dir.exists():
            rel_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy(r1_dir / "pipeline.joblib", rel_dir / "pipeline.joblib")
            with open(r1_dir / "manifest.json", encoding="utf-8") as f:
                m = json.load(f)
            m["release_id"] = rel_id
            with open(rel_dir / "manifest.json", "w", encoding="utf-8") as f:
                json.dump(m, f)
            created_dirs.append(rel_dir)
    yield
    for d in created_dirs:
        if d.name != "R2-candidate":
            shutil.rmtree(d, ignore_errors=True)


@pytest.fixture(autouse=True)
def mock_serving_slot_http(monkeypatch):
    """Hermetic test isolation: mock candidate slot readiness probe, identity, and reload endpoint."""
    current_state = {"release_id": "R2-candidate"}

    class MockHttpxClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def get(self, url, **kwargs):
            resp = MagicMock()
            resp.status_code = 200
            if "identity" in url:
                resp.json.return_value = {
                    "status": "ready",
                    "release_id": current_state["release_id"],
                }
            elif "readyz" in url:
                resp.json.return_value = {
                    "status": "ready",
                    "is_ready": True,
                    "inference_mode": "pipeline",
                }
            else:
                resp.json.return_value = {"status": "ok"}
            return resp

        def post(self, url, **kwargs):
            resp = MagicMock()
            resp.status_code = 200
            params = kwargs.get("params", {})
            if "release_id" in params:
                current_state["release_id"] = params["release_id"]
            resp.json.return_value = {"status": "reloaded"}
            return resp

    monkeypatch.setattr("httpx.Client", MockHttpxClient)


def test_canary_staging_and_initial_weight(tmp_path):
    """Verify staging a candidate assigns the inactive slot with 5% initial traffic weight."""
    init_db()
    db = SessionLocal()
    conf_file = tmp_path / "nginx_test.conf"
    conf_file.write_text("dummy")

    # Set initial state: Champion R1 in Slot A
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
    db.commit()

    controller = CanaryController(nginx_conf_path=conf_file)
    state = controller.stage_candidate(db, candidate_release="R2-candidate", initial_weight=0.05)

    assert state.champion_release == "R1"
    assert state.active_slot == "A"
    assert state.candidate_release == "R2-candidate"
    assert state.candidate_slot == "B"
    assert state.canary_weight == 0.05
    assert state.status == RolloutStatus.PROGRESSING

    # Check Nginx config generation: Slot A = 95, Slot B = 5
    content = conf_file.read_text()
    assert "server 127.0.0.1:8001 weight=95" in content
    assert "server 127.0.0.1:8002 weight=5" in content

    db.close()


def _seed_candidate_canary_data(db: SessionLocal, release_id: str, n_attack: int = 8, n_benign: int = 15):
    """Helper to seed valid labeled observations for candidate health gate checks."""
    import uuid

    from swayamkavach.db.models import GroundTruthLabelRecordDB, PredictionRecordDB

    for _i in range(n_attack):
        eid = f"seed_att_{release_id}_{uuid.uuid4().hex[:12]}"
        db.add(PredictionRecordDB(
            event_id=eid,
            score=0.92,
            prediction=1,
            release_id=release_id,
            model_version="v2",
            slot_id="B",
        ))
        db.add(GroundTruthLabelRecordDB(event_id=eid, label=1))

    for _i in range(n_benign):
        eid = f"seed_ben_{release_id}_{uuid.uuid4().hex[:12]}"
        db.add(PredictionRecordDB(
            event_id=eid,
            score=0.08,
            prediction=0,
            release_id=release_id,
            model_version="v2",
            slot_id="B",
        ))
        db.add(GroundTruthLabelRecordDB(event_id=eid, label=0))

    db.commit()


def test_canary_progressive_advancement_and_promotion(tmp_path):
    """Verify gradual traffic advancement (5% -> 25% -> 50% -> 100%) and automatic promotion."""
    init_db()
    db = SessionLocal()
    conf_file = tmp_path / "nginx_test.conf"
    conf_file.write_text("dummy")

    controller = CanaryController(nginx_conf_path=conf_file)

    # 1. Stage candidate
    controller.stage_candidate(db, candidate_release="R2-candidate", initial_weight=0.05)

    # Seed statistical evidence for candidate
    _seed_candidate_canary_data(db, release_id="R2-candidate", n_attack=8, n_benign=15)

    # 2. Advance to 25%
    s25 = controller.advance_stage(db)
    assert s25.canary_weight == 0.25
    assert s25.status == RolloutStatus.PROGRESSING
    assert "server 127.0.0.1:8001 weight=75" in conf_file.read_text()
    assert "server 127.0.0.1:8002 weight=25" in conf_file.read_text()

    # 3. Advance to 50%
    s50 = controller.advance_stage(db)
    assert s50.canary_weight == 0.50
    assert "server 127.0.0.1:8001 weight=50" in conf_file.read_text()
    assert "server 127.0.0.1:8002 weight=50" in conf_file.read_text()

    # 4. Advance past 50% -> Full Promotion!
    s_promo = controller.advance_stage(db)
    assert s_promo.champion_release == "R2-candidate"
    assert s_promo.active_slot == "B"  # Slot B promoted to champion
    assert s_promo.candidate_release is None
    assert s_promo.canary_weight == 0.0
    assert "server 127.0.0.1:8002 weight=100" in conf_file.read_text()
    assert "server 127.0.0.1:8001 weight=0" in conf_file.read_text()

    db.close()


def test_canary_warm_rollback(tmp_path):
    """Verify warm rollback immediately restores 100% champion traffic upon anomaly."""
    init_db()
    db = SessionLocal()
    conf_file = tmp_path / "nginx_test.conf"
    conf_file.write_text("dummy")

    # Set initial state: Champion R1 on Slot A
    rec = db.query(LifecycleStateRecordDB).first()
    if rec:
        rec.champion_release = "R1"
        rec.active_slot = "A"
        rec.candidate_release = None
        rec.candidate_slot = None
        rec.canary_weight = 0.0
        db.commit()

    controller = CanaryController(nginx_conf_path=conf_file)

    # Stage candidate in Slot B at 25%
    controller.stage_candidate(db, candidate_release="R2-faulty", initial_weight=0.25)


    # Trigger warm rollback
    s_rollback = controller.warm_rollback(db, reason="High error rate breach detected by watchdog")

    assert s_rollback.champion_release == "R1"
    assert s_rollback.active_slot == "A"
    assert s_rollback.candidate_release is None
    assert s_rollback.canary_weight == 0.0
    assert "ROLLED_BACK" in s_rollback.last_reason

    # Nginx immediately routes 100% to Slot A
    content = conf_file.read_text()
    assert "server 127.0.0.1:8001 weight=100" in content
    assert "server 127.0.0.1:8002 weight=0" in content

    db.close()


def test_canary_deployment_api_flow():
    """Verify deployment API endpoints for state querying, stage advancement, and rollback."""
    init_db()
    client = TestClient(app)

    # 1. Query initial state
    resp = client.get("/api/v1/deployment/state")
    assert resp.status_code == 200
    data = resp.json()
    assert "champion_release" in data
    assert "canary_weight" in data

    auth_headers = {"X-API-Key": "swayamkavach-control-plane-secret-key-v1"}

    from datetime import UTC, datetime, timedelta

    from swayamkavach.api.auth import generate_approval_signature
    from swayamkavach.db.models import ApprovedEvaluationRecordDB

    # Clean up any existing approval for isolated test run
    clean_db = SessionLocal()
    clean_db.query(ApprovedEvaluationRecordDB).filter(
        ApprovedEvaluationRecordDB.candidate_release_id == "R2"
    ).delete()
    clean_db.commit()
    clean_db.close()

    # 2a. Unauthenticated stage request must return 401 Unauthorized
    unauth_resp = client.post(
        "/api/v1/deployment/canary/stage",
        json={"candidate_release_id": "R2", "initial_weight": 0.05},
    )
    assert unauth_resp.status_code == 401

    # 2b. Unapproved candidate request must return 403 Forbidden
    unapproved_resp = client.post(
        "/api/v1/deployment/canary/stage",
        json={"candidate_release_id": "R2", "initial_weight": 0.05},
        headers=auth_headers,
    )
    assert unapproved_resp.status_code == 403
    assert "has not received cryptographic evaluation approval" in unapproved_resp.json()["detail"]

    # 2c. Seed approved evaluation record with valid HMAC signature
    from swayamkavach.db.models import ApprovedEvaluationRecordDB

    now_dt = datetime.now(UTC)
    exp_dt = now_dt + timedelta(hours=24)
    exp_iso = exp_dt.isoformat()
    cand_sha = "3639259c6fcc97ab90b13384fc9d44ce81cad8a34a0d9fcd3eaffab7fe1e6f39"
    sig = generate_approval_signature(
        report_id="EVAL_API_TEST",
        candidate_release_id="R2",
        candidate_sha256=cand_sha,
        operator_id="test_operator",
        expires_at_iso=exp_iso,
    )

    db = SessionLocal()
    rec = ApprovedEvaluationRecordDB(
        report_id="EVAL_API_TEST",
        candidate_release_id="R2",
        champion_release_id="R1",
        verdict="PASS",
        candidate_sha256=cand_sha,
        approval_hash=sig,
        operator_id="test_operator",
        expires_at=exp_dt,
        created_at=now_dt,
    )
    db.merge(rec)
    db.commit()
    db.close()

    # 2d. Stage approved candidate with valid credentials
    stage_resp = client.post(
        "/api/v1/deployment/canary/stage",
        json={"candidate_release_id": "R2", "initial_weight": 0.05},
        headers=auth_headers,
    )
    assert stage_resp.status_code == 200
    staged_data = stage_resp.json()
    assert staged_data["candidate_release"] == "R2"
    assert staged_data["canary_weight"] == 0.05

    # Seed statistical observations for candidate R2 so advance health gates pass
    db = SessionLocal()
    _seed_candidate_canary_data(db, release_id="R2", n_attack=8, n_benign=15)
    db.close()

    # 3. Advance stage
    adv_resp = client.post("/api/v1/deployment/canary/advance", headers=auth_headers)
    assert adv_resp.status_code == 200
    adv_data = adv_resp.json()
    assert adv_data["canary_weight"] == 0.25

    # 4. Trigger rollback
    rb_resp = client.post(
        "/api/v1/deployment/canary/rollback",
        json={"reason": "Manual operator abort from dashboard"},
        headers=auth_headers,
    )
    assert rb_resp.status_code == 200
    rb_data = rb_resp.json()
    assert rb_data["candidate_release"] is None
    assert rb_data["canary_weight"] == 0.0
    assert "ROLLED_BACK" in rb_data["last_reason"]


def test_canary_health_gate_failure_triggers_warm_rollback(tmp_path, monkeypatch):
    """Verify health gate failure triggers warm rollback when readyz fails during progression."""
    init_db()
    db = SessionLocal()
    conf_file = tmp_path / "nginx_test.conf"
    conf_file.write_text("dummy")

    # 1. Stage candidate successfully with healthy mock
    controller = CanaryController(nginx_conf_path=conf_file)
    controller.stage_candidate(db, candidate_release="R2-faulty", initial_weight=0.05)

    # 2. Seed data
    _seed_candidate_canary_data(db, release_id="R2-faulty", n_attack=8, n_benign=15)

    # 3. Now simulate health check failure during advance
    mock_resp_503 = MagicMock()
    mock_resp_503.status_code = 503

    class FailingClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def get(self, url, **kwargs):
            return mock_resp_503

        def post(self, url, **kwargs):
            return MagicMock(status_code=200)

    monkeypatch.setattr("httpx.Client", FailingClient)

    with pytest.raises(ValueError, match="Canary progression blocked: Candidate slot B failed readiness check"):
        controller.advance_stage(db)

    # Confirm warm rollback restored 100% traffic to champion
    state = controller.get_state(db)
    assert state.candidate_release is None
    assert state.canary_weight == 0.0
    assert "Health gate failure" in str(state.last_reason)
    db.close()


# ---------------------------------------------------------
# Issue 1 Tests: Canary evidence safety gate tests
# ---------------------------------------------------------

def test_zero_labeled_predictions_blocks_canary_promotion(tmp_path):
    """Issue 1: Zero labeled observations must block candidate progression and trigger rollback."""
    init_db()
    db = SessionLocal()
    conf_file = tmp_path / "nginx_test.conf"
    conf_file.write_text("dummy")

    controller = CanaryController(nginx_conf_path=conf_file)
    controller.stage_candidate(db, candidate_release="R2-zero-evidence", initial_weight=0.05)

    # With 0 labeled predictions in DB:
    with pytest.raises(ValueError, match="Candidate evaluation sample insufficient: 0 labeled predictions observed"):
        controller.advance_stage(db)

    # Rolled back
    state = controller.get_state(db)
    assert state.candidate_release is None
    assert state.canary_weight == 0.0
    db.close()


def test_all_benign_predictions_blocks_attack_recall_gate(tmp_path):
    """Issue 1: An all-benign evaluation sample cannot verify attack recall and must block advancement."""
    init_db()
    db = SessionLocal()
    conf_file = tmp_path / "nginx_test.conf"
    conf_file.write_text("dummy")

    controller = CanaryController(nginx_conf_path=conf_file)
    controller.stage_candidate(db, candidate_release="R2-all-benign", initial_weight=0.05)

    # Seed 20 benign, 0 attacks
    _seed_candidate_canary_data(db, release_id="R2-all-benign", n_attack=0, n_benign=20)

    with pytest.raises(ValueError, match="Insufficient attack observations to verify recall"):
        controller.advance_stage(db)

    db.close()


def test_all_attack_predictions_blocks_fpr_gate(tmp_path):
    """Issue 1: An all-attack evaluation sample cannot verify FPR and must block advancement."""
    init_db()
    db = SessionLocal()
    conf_file = tmp_path / "nginx_test.conf"
    conf_file.write_text("dummy")

    controller = CanaryController(nginx_conf_path=conf_file)
    controller.stage_candidate(db, candidate_release="R2-all-attack", initial_weight=0.05)

    # Seed 15 attacks, 0 benign
    _seed_candidate_canary_data(db, release_id="R2-all-attack", n_attack=15, n_benign=0)

    with pytest.raises(ValueError, match="Insufficient benign observations to verify FPR"):
        controller.advance_stage(db)

    db.close()


# ---------------------------------------------------------
# Issue 2 Tests: Verified Nginx routing tests
# ---------------------------------------------------------

def test_missing_nginx_configuration_path_fails_safely(tmp_path):
    """Issue 2: Staging must fail cleanly if Nginx config directory is invalid."""
    init_db()
    db = SessionLocal()
    nonexistent_conf = tmp_path / "nonexistent_dir" / "sub" / "nginx.conf"

    controller = CanaryController(nginx_conf_path=nonexistent_conf)
    with pytest.raises((RuntimeError, ValueError, FileNotFoundError)):
        controller.stage_candidate(db, candidate_release="R2-nginx-missing", initial_weight=0.05)

    db.close()


# ---------------------------------------------------------
# Issue 3 Tests: Pre-flight candidate verification before routing
# ---------------------------------------------------------

def test_candidate_reload_http_500_blocks_staging(tmp_path, monkeypatch):
    """Issue 3: HTTP 500 on candidate slot reload must block staging and prevent traffic exposure."""
    init_db()
    db = SessionLocal()
    conf_file = tmp_path / "nginx_test.conf"
    conf_file.write_text("server 127.0.0.1:8001 weight=100;\n")

    class Reload500Client:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def get(self, url, **kwargs):
            return MagicMock(status_code=200, json=lambda: {"is_ready": True, "inference_mode": "pipeline"})

        def post(self, url, **kwargs):
            return MagicMock(status_code=500)

    monkeypatch.setattr("httpx.Client", Reload500Client)

    controller = CanaryController(nginx_conf_path=conf_file)
    with pytest.raises(RuntimeError, match="Candidate slot reload failed with HTTP 500"):
        controller.stage_candidate(db, candidate_release="R2-bad-reload", initial_weight=0.05)

    # Verify no traffic was routed to candidate: config remains 100% Slot A
    content = conf_file.read_text()
    assert "8002" not in content
    db.close()


def test_candidate_heuristic_inference_mode_blocks_staging(tmp_path, monkeypatch):
    """Issue 3: Heuristic fallback inference mode on candidate slot must be rejected."""
    init_db()
    db = SessionLocal()
    conf_file = tmp_path / "nginx_test.conf"
    conf_file.write_text("server 127.0.0.1:8001 weight=100;\n")

    class HeuristicClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def get(self, url, **kwargs):
            return MagicMock(
                status_code=200,
                json=lambda: {"is_ready": True, "inference_mode": "heuristic"},
            )

        def post(self, url, **kwargs):
            return MagicMock(status_code=200)

    monkeypatch.setattr("httpx.Client", HeuristicClient)

    controller = CanaryController(nginx_conf_path=conf_file)
    with pytest.raises(RuntimeError, match="Candidate slot is running in forbidden heuristic fallback mode"):
        controller.stage_candidate(db, candidate_release="R2-heuristic", initial_weight=0.05)

    db.close()

