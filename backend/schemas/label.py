"""Delayed ground-truth label schemas for model evaluation and DARI damage estimation."""

from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field


class DelayedLabelItem(BaseModel):
    """Ground truth label report for an observed flow event."""

    model_config = ConfigDict(extra="forbid")

    event_id: str = Field(..., description="Target flow event ID")
    label: int = Field(..., ge=0, le=1, description="Binary ground truth label (0 = normal, 1 = attack)")
    attack_type: str | None = Field(default=None, description="Fine-grained attack category if attack (e.g., ddos, dos)")
    source: str = Field(default="analyst_verification", description="Source or verifier of ground truth label")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Verification confidence level")
    received_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when label arrived in control plane",
    )


class DelayedLabelBatch(BaseModel):
    """Batch ingestion payload of verified ground truth labels."""

    model_config = ConfigDict(extra="forbid")

    labels: list[DelayedLabelItem] = Field(..., min_length=1, description="List of delayed event labels")


class DelayedLabelReceipt(BaseModel):
    """Response returned upon successful label persistence."""

    model_config = ConfigDict(extra="forbid")

    status: str = Field(default="accepted")
    ingested_count: int = Field(..., ge=0)
    updated_count: int = Field(default=0, ge=0)
