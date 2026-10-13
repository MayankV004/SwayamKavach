"""Security intrusion alert schema."""

from datetime import UTC, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class AlertRecord(BaseModel):
    """Committed intrusion alert."""

    alert_id: str = Field(..., description="Unique alert identifier")
    event_id: str = Field(..., description="Triggering flow event ID")
    severity: Literal["low", "medium", "high", "critical"] = Field(..., description="Alert severity level")
    score: float = Field(..., ge=0.0, le=1.0, description="Model anomaly probability score")
    release_id: str = Field(..., description="Model release that raised the alert (e.g. R1)")
    status: Literal["active", "acknowledged", "resolved", "false_positive"] = Field(
        default="active",
        description="Adjudication status"
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), description="Creation timestamp")
    metadata: dict[str, Any] | None = Field(default=None, description="Optional network context (IPs, service, proto)")
