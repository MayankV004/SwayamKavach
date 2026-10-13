"""Health check routes for API control plane."""

from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from swayamkavach.db.session import get_db

router = APIRouter(tags=["Health"])


@router.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Basic service liveness check."""
    return {"status": "healthy", "service": "swayamkavach-api"}


@router.get("/readyz", status_code=status.HTTP_200_OK)
def readiness_check(db: Session = Depends(get_db)):
    """Readiness probe that verifies DB connection."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as exc:
        return {"status": "degraded", "database": str(exc)}
