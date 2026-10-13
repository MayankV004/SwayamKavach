"""Durable background inference consumer.

Claims unpredicted flow events from the database, dispatches them to the model serving slot,
and transactionally records predictions and advisory alerts.
"""

import logging
import os
import time
import uuid
from datetime import UTC, datetime

import httpx
from sqlalchemy.orm import Session

from schemas.flow_event import FlowEvent, TONConnectionFeatures
from schemas.prediction import PredictionRequest, PredictionResponse
from swayamkavach.db.models import AlertRecordDB, FlowEventRecordDB, PredictionRecordDB
from swayamkavach.db.session import SessionLocal

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] consumer: %(message)s")
logger = logging.getLogger("swayamkavach.consumer")

SERVING_URL = os.getenv("SLOT_A_URL", "http://localhost:8001")
BATCH_SIZE = int(os.getenv("CONSUMER_BATCH_SIZE", "50"))
POLL_INTERVAL_SECONDS = float(os.getenv("CONSUMER_POLL_INTERVAL", "1.0"))


def process_unpredicted_events(db: Session, serving_url: str = SERVING_URL) -> int:
    """Fetch unpredicted events, invoke model slot, and record results."""
    # 1. Claim up to BATCH_SIZE events
    events = (
        db.query(FlowEventRecordDB)
        .filter(FlowEventRecordDB.is_predicted.is_(False))
        .order_by(FlowEventRecordDB.created_at.asc())
        .limit(BATCH_SIZE)
        .all()
    )

    if not events:
        return 0

    # 2. Build prediction request
    flow_event_objs = []
    for ev in events:
        feat = TONConnectionFeatures(**ev.features)
        flow_event_objs.append(
            FlowEvent(
                event_id=ev.event_id,
                sensor_id=ev.sensor_id,
                capture_id=ev.capture_id,
                event_time=ev.event_time,
                features=feat,
            )
        )

    req = PredictionRequest(events=flow_event_objs, prediction_purpose="production")

    # 3. Request inference outside DB transaction
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(f"{serving_url}/predict", json=req.model_dump(mode="json"))
            resp.raise_for_status()
            pred_data = resp.json()
            prediction_response = PredictionResponse(**pred_data)
    except Exception as exc:
        logger.error(f"Inference serving slot error ({serving_url}): {exc}")
        return 0

    # 4. Commit predictions and alerts atomically
    try:
        event_map = {ev.event_id: ev for ev in events}

        for pred in prediction_response.predictions:
            # Insert prediction record
            db.add(
                PredictionRecordDB(
                    event_id=pred.event_id,
                    prediction_purpose=pred.prediction_purpose,
                    score=pred.score,
                    prediction=pred.prediction,
                    release_id=pred.release_id,
                    model_version=pred.model_version,
                    slot_id=pred.slot_id,
                    predicted_at=pred.predicted_at,
                )
            )

            # Raise alert if flagged as attack (class == 1)
            if pred.prediction == 1:
                severity = "critical" if pred.score >= 0.85 else ("high" if pred.score >= 0.70 else "medium")
                alert = AlertRecordDB(
                    alert_id=f"alert-{uuid.uuid4().hex[:12]}",
                    event_id=pred.event_id,
                    severity=severity,
                    score=pred.score,
                    release_id=pred.release_id,
                    status="active",
                    created_at=datetime.now(UTC),
                    meta_info={"slot": pred.slot_id, "score": pred.score},
                )
                db.add(alert)

            # Mark flow event as processed
            if pred.event_id in event_map:
                event_map[pred.event_id].is_predicted = True

        db.commit()
        logger.info(f"Committed predictions for {len(events)} events (Serving Slot: {prediction_response.slot_id})")
        return len(events)
    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to commit prediction batch: {exc}")
        return 0


def run_consumer_loop():
    """Continuous polling worker loop."""
    logger.info(f"Starting inference consumer (Target: {SERVING_URL})...")
    while True:
        db = SessionLocal()
        try:
            processed = process_unpredicted_events(db)
            if processed == 0:
                time.sleep(POLL_INTERVAL_SECONDS)
        except Exception as exc:
            logger.error(f"Consumer loop unhandled error: {exc}")
            time.sleep(POLL_INTERVAL_SECONDS)
        finally:
            db.close()


if __name__ == "__main__":
    run_consumer_loop()
