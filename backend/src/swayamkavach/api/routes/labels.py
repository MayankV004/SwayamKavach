"""Delayed ground-truth label ingestion endpoints."""

import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from schemas.label import DelayedLabelBatch, DelayedLabelItem, DelayedLabelReceipt
from swayamkavach.api.auth import OperatorContext, require_control_plane_auth
from swayamkavach.db.models import GroundTruthLabelRecordDB
from swayamkavach.db.session import get_db

logger = logging.getLogger("swayamkavach.api.labels")
router = APIRouter(prefix="/labels", tags=["Labels"])


@router.post("", response_model=DelayedLabelReceipt, status_code=status.HTTP_201_CREATED)
def ingest_labels(
    payload: DelayedLabelBatch,
    db: Session = Depends(get_db),
    _operator: OperatorContext = Depends(require_control_plane_auth),
):
    """Ingest a batch of verified ground-truth labels for flow events.

    Performs idempotent insert/update for each label record.
    """
    ingested_count = 0
    updated_count = 0
    now_utc = datetime.now(UTC)

    try:
        for item in payload.labels:
            existing = db.query(GroundTruthLabelRecordDB).filter_by(event_id=item.event_id).first()
            if existing:
                existing.label = item.label
                existing.attack_type = item.attack_type
                existing.source = item.source
                existing.confidence = item.confidence
                existing.received_at = now_utc
                updated_count += 1
            else:
                record = GroundTruthLabelRecordDB(
                    event_id=item.event_id,
                    label=item.label,
                    attack_type=item.attack_type,
                    source=item.source,
                    confidence=item.confidence,
                    received_at=now_utc,
                )
                db.add(record)
                ingested_count += 1

        db.commit()
        logger.info("Ingested %d new labels, updated %d labels", ingested_count, updated_count)
        return DelayedLabelReceipt(
            status="accepted",
            ingested_count=ingested_count,
            updated_count=updated_count,
        )
    except Exception as exc:
        db.rollback()
        logger.error("Failed to commit label batch: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Label batch commit failure: {exc}",
        ) from exc


@router.get("", response_model=list[DelayedLabelItem])
def list_labels(
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve ingested ground-truth labels with pagination."""
    records = (
        db.query(GroundTruthLabelRecordDB)
        .order_by(GroundTruthLabelRecordDB.received_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        DelayedLabelItem(
            event_id=r.event_id,
            label=r.label,
            attack_type=r.attack_type,
            source=r.source,
            confidence=r.confidence,
            received_at=r.received_at.replace(tzinfo=UTC) if r.received_at.tzinfo is None else r.received_at,
        )
        for r in records
    ]
