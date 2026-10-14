"""Integration tests for Phase 2: Ingestion -> DB Queue -> Inference Consumer -> Serving Slot A (R1) -> Alert API."""

from datetime import UTC, datetime
from unittest.mock import patch

from starlette.testclient import TestClient

from schemas.flow_event import FlowEvent, NetworkIdentifiers, TONConnectionFeatures
from schemas.ingestion import BatchIngestRequest
from swayamkavach.db.models import AlertRecordDB, FlowEventRecordDB, PredictionRecordDB
from swayamkavach.inference_consumer import process_unpredicted_events
from swayamkavach.serving.app import app as serving_app


def _build_test_stream_batch(batch_id: str = "batch-e2e-001") -> BatchIngestRequest:
    """Build a batch with 1 verified normal flow and 1 verified attack flow."""
    now = datetime.now(UTC)

    # 1. Normal DNS flow
    normal_flow = FlowEvent(
        event_id=f"evt-{batch_id}-normal",
        sensor_id="sensor-edge-01",
        event_time=now,
        features=TONConnectionFeatures(
            duration=0.0,
            src_bytes=0,
            dst_bytes=0,
            src_ip_bytes=62,
            dst_ip_bytes=0,
            src_pkts=1,
            dst_pkts=0,
            proto="udp",
            service="dns",
            conn_state="S0",
            missed_bytes=0,
        ),
        identifiers=NetworkIdentifiers(
            src_ip="192.168.1.195",
            dst_ip="192.168.1.190",
            src_port=51905,
            dst_port=53,
        ),
    )

    # 2. Anomalous Attack flow
    attack_flow = FlowEvent(
        event_id=f"evt-{batch_id}-attack",
        sensor_id="sensor-edge-01",
        event_time=now,
        features=TONConnectionFeatures(
            duration=290.0,
            src_bytes=101568,
            dst_bytes=2592,
            src_ip_bytes=108064,
            dst_ip_bytes=3832,
            src_pkts=108,
            dst_pkts=31,
            proto="tcp",
            service="-",
            conn_state="OTH",
            missed_bytes=0,
        ),
        identifiers=NetworkIdentifiers(
            src_ip="192.168.1.37",
            dst_ip="192.168.1.193",
            src_port=4444,
            dst_port=49178,
        ),
    )

    return BatchIngestRequest(
        batch_id=batch_id,
        sensor_id="sensor-edge-01",
        schema_version="ton-conn-11-v1",
        extractor_id="zeek-e2e-v1",
        events=[normal_flow, attack_flow],
    )


def test_e2e_ingest_consumer_serving_alerts_flow(client, db_session):
    """Verify Exit Gate G2 end-to-end durable slice:

    Ingest batch -> DB queue -> Consumer -> Serving Slot A (R1) -> Alert in DB & API.
    """
    batch_req = _build_test_stream_batch("batch-e2e-slice-1")

    # 1. Ingest batch -> 202 Accepted
    resp = client.post("/api/v1/ingestion/batches", json=batch_req.model_dump(mode="json"))
    assert resp.status_code == 202
    assert resp.json()["status"] == "accepted"
    assert resp.json()["accepted_count"] == 2

    # Verify unpredicted state in DB
    unpredicted_count = (
        db_session.query(FlowEventRecordDB)
        .filter_by(batch_id="batch-e2e-slice-1", is_predicted=False)
        .count()
    )
    assert unpredicted_count == 2

    # 2. Wire consumer directly to real Serving Slot A (loading R1 bundle)
    serving_test_client = TestClient(serving_app)

    def mock_serving_post(url, **kwargs):
        return serving_test_client.post("/predict", **kwargs)

    with patch("httpx.Client") as mock_client_cls:
        client_instance = mock_client_cls.return_value.__enter__.return_value
        client_instance.post.side_effect = mock_serving_post

        # 3. Consumer runs and processes unpredicted events
        processed = process_unpredicted_events(db_session, serving_url="http://localhost:8001")
        assert processed == 2

    # 4. Verify DB persistence: flow events marked predicted, predictions and alerts recorded
    predicted_events = (
        db_session.query(FlowEventRecordDB)
        .filter_by(batch_id="batch-e2e-slice-1", is_predicted=True)
        .all()
    )
    assert len(predicted_events) == 2

    predictions = (
        db_session.query(PredictionRecordDB)
        .filter(PredictionRecordDB.event_id.in_(["evt-batch-e2e-slice-1-normal", "evt-batch-e2e-slice-1-attack"]))
        .all()
    )
    assert len(predictions) == 2

    pred_map = {p.event_id: p for p in predictions}
    assert pred_map["evt-batch-e2e-slice-1-normal"].prediction == 0
    assert pred_map["evt-batch-e2e-slice-1-normal"].score < 0.42

    assert pred_map["evt-batch-e2e-slice-1-attack"].prediction == 1
    assert pred_map["evt-batch-e2e-slice-1-attack"].score >= 0.42

    # 5. Verify that an alert was generated ONLY for the attack flow
    alerts = (
        db_session.query(AlertRecordDB)
        .filter_by(event_id="evt-batch-e2e-slice-1-attack")
        .all()
    )
    assert len(alerts) == 1
    assert alerts[0].release_id == "R1"
    assert alerts[0].status == "active"
    assert alerts[0].severity in ["critical", "high"]

    normal_alerts = (
        db_session.query(AlertRecordDB)
        .filter_by(event_id="evt-batch-e2e-slice-1-normal")
        .count()
    )
    assert normal_alerts == 0

    # 6. Verify alerts are returned via API
    api_alerts_resp = client.get("/api/v1/alerts")
    assert api_alerts_resp.status_code == 200
    alert_list = api_alerts_resp.json()
    assert any(a["event_id"] == "evt-batch-e2e-slice-1-attack" for a in alert_list)

    # 7. Verify /api/v1/lifecycle reports champion R1 and slot A
    lifecycle_resp = client.get("/api/v1/lifecycle")
    assert lifecycle_resp.status_code == 200
    lc_data = lifecycle_resp.json()
    assert lc_data["champion_release"] == "R1"
    assert lc_data["active_slot"] == "A"

    # 8. Verify idempotency: subsequent consumer run processes 0 remaining events
    processed_again = process_unpredicted_events(db_session, serving_url="http://localhost:8001")
    assert processed_again == 0
