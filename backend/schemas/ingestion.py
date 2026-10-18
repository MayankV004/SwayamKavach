"""Batch ingestion contracts for SwayamKavach."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from schemas.flow_event import FlowEvent


class BatchIngestRequest(BaseModel):
    """Payload sent by Zeek sensor or replay generator to FastAPI ingestion endpoint."""

    model_config = ConfigDict(extra="forbid")

    batch_id: str = Field(..., description="Unique batch identifier for idempotency")
    sensor_id: str = Field(..., description="Sensor or replay agent identifier")
    schema_version: str = Field(default="ton-conn-11-v1", description="Declared feature schema version")
    extractor_id: str = Field(default="zeek-pinned-v1", description="Digest/ID of feature extractor implementation")
    events: list[FlowEvent] = Field(..., min_length=1, max_length=10000, description="List of flow events in batch")


class BatchReceiptResponse(BaseModel):
    """Immediate durable receipt returned with HTTP 202."""

    batch_id: str = Field(..., description="Acknowledged batch ID")
    status: Literal["accepted", "rejected", "duplicate"] = Field(..., description="Ingestion admission status")
    accepted_count: int = Field(default=0, ge=0, description="Count of accepted valid flow events")
    rejected_count: int = Field(default=0, ge=0, description="Count of rejected events (e.g., schema faults)")
    received_at: datetime = Field(default_factory=lambda: datetime.now(UTC), description="UTC receipt timestamp")
    message: str | None = Field(default=None, description="Diagnostic notes or error explanations")
