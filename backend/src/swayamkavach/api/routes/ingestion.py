"""Authenticated batch ingestion endpoints."""

import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from schemas.ingestion import BatchIngestRequest, BatchReceiptResponse
from swayamkavach.api.auth import OperatorContext, require_control_plane_auth
from swayamkavach.db.models import FlowEventRecordDB, IngestionBatchRecordDB
from swayamkavach.db.session import get_db

logger = logging.getLogger("swayamkavach.api.ingestion")
router = APIRouter(prefix="/ingestion", tags=["Ingestion"])


@router.post("/batches", response_model=BatchReceiptResponse, status_code=status.HTTP_202_ACCEPTED)
def ingest_batch(
    payload: BatchIngestRequest,
    db: Session = Depends(get_db),
    _operator: OperatorContext = Depends(require_control_plane_auth),
):
    """Accept and durably persist a batch of Zeek flow events.

    Returns HTTP 202 with durable receipt acknowledging acceptance.
    """
    # 1. Idempotency check: see if batch_id already exists
    existing = db.query(IngestionBatchRecordDB).filter_by(batch_id=payload.batch_id).first()
    if existing:
        logger.info(f"Duplicate batch submitted: {payload.batch_id}")
        return BatchReceiptResponse(
            batch_id=payload.batch_id,
            status="duplicate",
            accepted_count=existing.event_count,
            rejected_count=0,
            received_at=existing.received_at,
            message="Batch previously accepted and persisted",
        )

    # 2. Transactionally commit batch header and individual flow records
    try:
        now_utc = datetime.now(UTC)
        batch_record = IngestionBatchRecordDB(
            batch_id=payload.batch_id,
            sensor_id=payload.sensor_id,
            schema_version=payload.schema_version,
            extractor_id=payload.extractor_id,
            event_count=len(payload.events),
            status="accepted",
            received_at=now_utc,
        )
        db.add(batch_record)

        for event in payload.events:
            flow_record = FlowEventRecordDB(
                event_id=event.event_id,
                batch_id=payload.batch_id,
                sensor_id=event.sensor_id,
                capture_id=event.capture_id,
                event_time=event.event_time,
                features=event.features.model_dump(),
                identifiers=event.identifiers.model_dump() if event.identifiers else None,
                is_predicted=False,
                created_at=now_utc,
            )
            db.add(flow_record)

        db.commit()
        logger.info(f"Successfully accepted batch {payload.batch_id} with {len(payload.events)} events")

        return BatchReceiptResponse(
            batch_id=payload.batch_id,
            status="accepted",
            accepted_count=len(payload.events),
            rejected_count=0,
            received_at=batch_record.received_at,
            message="Batch durably accepted for inference",
        )
    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to persist batch {payload.batch_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database commit error: {str(exc)}",
        ) from exc


@router.get("/batches/{batch_id}", status_code=status.HTTP_200_OK)
def get_batch_status(batch_id: str, db: Session = Depends(get_db)):
    """Retrieve status and event count of an ingestion batch."""
    batch = db.query(IngestionBatchRecordDB).filter_by(batch_id=batch_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Batch {batch_id} not found")

    return {
        "batch_id": batch.batch_id,
        "sensor_id": batch.sensor_id,
        "schema_version": batch.schema_version,
        "status": batch.status,
        "event_count": batch.event_count,
        "received_at": batch.received_at,
    }
