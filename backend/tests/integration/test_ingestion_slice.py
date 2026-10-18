"""Integration tests for the ingestion, idempotency, and persistence slice."""

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

from schemas.flow_event import FlowEvent, NetworkIdentifiers, TONConnectionFeatures
from schemas.ingestion import BatchIngestRequest
from schemas.prediction import PredictionResponse, PredictionResult
from swayamkavach.db.models import (
    AlertRecordDB,
    FlowEventRecordDB,
    IngestionBatchRecordDB,
    PredictionRecordDB,
)
from swayamkavach.inference_consumer import process_unpredicted_events


def _build_sample_batch(batch_id: str = "batch-test-101", count: int = 5) -> BatchIngestRequest:
    events = []
    for i in range(count):
        feat = TONConnectionFeatures(
            duration=1.0 + i,
            src_bytes=100 * (i + 1),
            dst_bytes=200 * (i + 1),
            src_ip_bytes=120 * (i + 1),
            dst_ip_bytes=240 * (i + 1),
            proto="tcp",
            service="http",
            conn_state="SF",
        )
        ident = NetworkIdentifiers(
            src_ip=f"192.168.1.{10 + i}",
            dst_ip="10.0.0.1",
            src_port=50000 + i,
            dst_port=80,
        )
        events.append(
            FlowEvent(
                event_id=f"evt-{batch_id}-{i}",
                sensor_id="sensor-alpha",
                event_time=datetime.now(UTC),
                features=feat,
                identifiers=ident,
            )
        )
    return BatchIngestRequest(
        batch_id=batch_id,
        sensor_id="sensor-alpha",
        schema_version="ton-conn-11-v1",
        extractor_id="zeek-test-sha",
        events=events,
    )


def test_batch_ingest_and_idempotency(client, db_session):
    """Test batch acceptance, database persistence, and duplicate protection."""
    batch_req = _build_sample_batch("batch-idempotency-01", count=3)

    # 1. First submission -> 202 Accepted
    resp1 = client.post("/api/v1/ingestion/batches", json=batch_req.model_dump(mode="json"))
    assert resp1.status_code == 202
    data1 = resp1.json()
    assert data1["status"] == "accepted"
    assert data1["accepted_count"] == 3

    # Check DB rows
    batch_db = db_session.query(IngestionBatchRecordDB).filter_by(batch_id="batch-idempotency-01").first()
    assert batch_db is not None
    assert batch_db.event_count == 3

    events_db = db_session.query(FlowEventRecordDB).filter_by(batch_id="batch-idempotency-01").all()
    assert len(events_db) == 3

    # 2. Duplicate submission -> returns status duplicate, no new rows added
    resp2 = client.post("/api/v1/ingestion/batches", json=batch_req.model_dump(mode="json"))
    assert resp2.status_code == 202
    data2 = resp2.json()
    assert data2["status"] == "duplicate"

    total_events = db_session.query(FlowEventRecordDB).filter_by(batch_id="batch-idempotency-01").count()
    assert total_events == 3


def test_inference_consumer_processing(client, db_session):
    """Test that unpredicted events are picked up, scored, and committed."""
    batch_req = _build_sample_batch("batch-consumer-01", count=2)
    client.post("/api/v1/ingestion/batches", json=batch_req.model_dump(mode="json"))

    # Mock model serving slot response
    mock_resp = PredictionResponse(
        predictions=[
            PredictionResult(
                event_id="evt-batch-consumer-01-0",
                score=0.15,
                prediction=0,  # Benign
                prediction_purpose="production",
                release_id="R1",
                model_version="v1.0-test",
                slot_id="A",
                predicted_at=datetime.now(UTC),
            ),
            PredictionResult(
                event_id="evt-batch-consumer-01-1",
                score=0.92,
                prediction=1,  # Attack!
                prediction_purpose="production",
                release_id="R1",
                model_version="v1.0-test",
                slot_id="A",
                predicted_at=datetime.now(UTC),
            ),
        ],
        slot_id="A",
        release_id="R1",
        execution_time_ms=1.2,
    )

    with patch("httpx.Client.post") as mock_post:
        mock_http_resp = MagicMock()
        mock_http_resp.json.return_value = mock_resp.model_dump(mode="json")
        mock_http_resp.raise_for_status.return_value = None
        mock_post.return_value = mock_http_resp

        # Run one consumer cycle
        processed = process_unpredicted_events(db_session, serving_url="http://mock-slot-a:8001")
        assert processed == 2

    # Check that predictions are stored in DB
    preds = db_session.query(PredictionRecordDB).all()
    assert len(preds) == 2

    # Check that an alert was committed for the attack event
    alerts = db_session.query(AlertRecordDB).all()
    assert len(alerts) == 1
    assert alerts[0].event_id == "evt-batch-consumer-01-1"
    assert alerts[0].severity == "critical"
    assert alerts[0].score == 0.92

    # Check that event is marked as is_predicted = True
    ev1 = db_session.query(FlowEventRecordDB).filter_by(event_id="evt-batch-consumer-01-0").first()
    ev2 = db_session.query(FlowEventRecordDB).filter_by(event_id="evt-batch-consumer-01-1").first()
    assert ev1.is_predicted is True
    assert ev2.is_predicted is True
