"""Unit tests for Phase 7 Two-Slot Canary Rollout, progressive stepping, and warm rollback."""

from starlette.testclient import TestClient

from swayamkavach.api.main import app
from swayamkavach.db.models import LifecycleStateRecordDB
from swayamkavach.db.session import SessionLocal, init_db
from swayamkavach.deployment.canary import CanaryController, RolloutStatus


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


def test_canary_progressive_advancement_and_promotion(tmp_path):
    """Verify gradual traffic advancement (5% -> 25% -> 50% -> 100%) and automatic promotion."""
    init_db()
    db = SessionLocal()
    conf_file = tmp_path / "nginx_test.conf"
    conf_file.write_text("dummy")

    controller = CanaryController(nginx_conf_path=conf_file)

    # 1. Stage candidate
    controller.stage_candidate(db, candidate_release="R2-candidate", initial_weight=0.05)

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

    # 2. Stage candidate
    stage_resp = client.post(
        "/api/v1/deployment/canary/stage",
        json={"candidate_release_id": "R2-candidate-api", "initial_weight": 0.05},
    )
    assert stage_resp.status_code == 200
    staged_data = stage_resp.json()
    assert staged_data["candidate_release"] == "R2-candidate-api"
    assert staged_data["canary_weight"] == 0.05

    # 3. Advance stage
    adv_resp = client.post("/api/v1/deployment/canary/advance")
    assert adv_resp.status_code == 200
    adv_data = adv_resp.json()
    assert adv_data["canary_weight"] == 0.25

    # 4. Trigger rollback
    rb_resp = client.post(
        "/api/v1/deployment/canary/rollback",
        json={"reason": "Manual operator abort from dashboard"},
    )
    assert rb_resp.status_code == 200
    rb_data = rb_resp.json()
    assert rb_data["candidate_release"] is None
    assert rb_data["canary_weight"] == 0.0
    assert "ROLLED_BACK" in rb_data["last_reason"]
