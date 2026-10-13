"""Model prediction request and result schemas."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from schemas.flow_event import FlowEvent


class PredictionRequest(BaseModel):
    """Payload sent by inference consumer to model serving slot (/predict)."""

    model_config = ConfigDict(extra="forbid")

    events: list[FlowEvent] = Field(..., min_length=1, description="List of events to score")
    prediction_purpose: Literal["production", "shadow", "canary", "evaluation"] = Field(
        default="production",
        description="Routing purpose of prediction"
    )


class PredictionResult(BaseModel):
    """Individual prediction output with model release provenance."""

    event_id: str = Field(..., description="Correlated event ID")
    score: float = Field(..., ge=0.0, le=1.0, description="Attack probability score")
    prediction: int = Field(..., ge=0, le=1, description="Binary classification (0 = Normal, 1 = Attack)")
    prediction_purpose: str = Field(..., description="Operational purpose")
    release_id: str = Field(..., description="Model release identifier (e.g., R1, R2)")
    model_version: str = Field(..., description="Exact model version / SHA")
    slot_id: str = Field(..., description="Serving slot that evaluated the request (e.g., A, B)")
    predicted_at: datetime = Field(default_factory=lambda: datetime.now(UTC), description="UTC timestamp of prediction execution")


class PredictionResponse(BaseModel):
    """Response returned from model serving slot."""

    predictions: list[PredictionResult] = Field(..., description="List of predictions")
    slot_id: str = Field(..., description="Responding serving slot")
    release_id: str = Field(..., description="Active loaded model release")
    execution_time_ms: float | None = Field(default=None, description="Inference latency in milliseconds")
