"""Alert query and management routes."""


from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from schemas.alert import AlertRecord
from swayamkavach.db.models import AlertRecordDB
from swayamkavach.db.session import get_db

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=list[AlertRecord], status_code=status.HTTP_200_OK)
def list_alerts(
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Retrieve security intrusion alerts."""
    query = db.query(AlertRecordDB)
    if status_filter:
        query = query.filter(AlertRecordDB.status == status_filter)

    results = query.order_by(AlertRecordDB.created_at.desc()).limit(limit).all()

    return [
        AlertRecord(
            alert_id=r.alert_id,
            event_id=r.event_id,
            severity=r.severity,  # type: ignore[arg-type]
            score=r.score,
            release_id=r.release_id,
            status=r.status,  # type: ignore[arg-type]
            created_at=r.created_at,
            metadata=r.meta_info,
        )
        for r in results
    ]


@router.get("/{alert_id}", response_model=AlertRecord, status_code=status.HTTP_200_OK)
def get_alert(alert_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed alert by ID."""
    alert = db.query(AlertRecordDB).filter_by(alert_id=alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Alert {alert_id} not found")

    return AlertRecord(
        alert_id=alert.alert_id,
        event_id=alert.event_id,
        severity=alert.severity,  # type: ignore[arg-type]
        score=alert.score,
        release_id=alert.release_id,
        status=alert.status,  # type: ignore[arg-type]
        created_at=alert.created_at,
        metadata=alert.meta_info,
    )
