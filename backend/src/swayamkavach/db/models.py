"""SQLAlchemy ORM models for durable system state."""

from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from swayamkavach.db.session import Base


class IngestionBatchRecordDB(Base):
    """Tracks ingested batches of flow events."""

    __tablename__ = "ingestion_batches"

    batch_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    sensor_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    schema_version: Mapped[str] = mapped_column(String(64), nullable=False)
    extractor_id: Mapped[str] = mapped_column(String(128), nullable=False)
    event_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), default="accepted", index=True)
    received_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    events = relationship("FlowEventRecordDB", back_populates="batch", cascade="all, delete-orphan")


class FlowEventRecordDB(Base):
    """Raw durable flow event record."""

    __tablename__ = "flow_events"

    event_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    batch_id: Mapped[str] = mapped_column(String(128), ForeignKey("ingestion_batches.batch_id"), nullable=False, index=True)
    sensor_id: Mapped[str] = mapped_column(String(64), nullable=False)
    capture_id: Mapped[str] = mapped_column(String(128), nullable=True)
    event_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    features: Mapped[dict] = mapped_column(JSON, nullable=False)
    identifiers: Mapped[dict] = mapped_column(JSON, nullable=True)
    is_predicted: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    batch = relationship("IngestionBatchRecordDB", back_populates="events")


class PredictionRecordDB(Base):
    """Committed model prediction."""

    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    prediction_purpose: Mapped[str] = mapped_column(String(32), default="production", index=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    prediction: Mapped[int] = mapped_column(Integer, nullable=False)
    release_id: Mapped[str] = mapped_column(String(64), nullable=False)
    model_version: Mapped[str] = mapped_column(String(128), nullable=False)
    slot_id: Mapped[str] = mapped_column(String(8), nullable=False)
    predicted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Invariant: exactly one authoritative production prediction per event_id
    __table_args__ = (
        UniqueConstraint("event_id", "prediction_purpose", name="uq_event_purpose"),
    )


class AlertRecordDB(Base):
    """Raised security intrusion alert."""

    __tablename__ = "alerts"

    alert_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    event_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(32), default="medium", index=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    release_id: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    meta_info: Mapped[dict] = mapped_column(JSON, nullable=True)


class LifecycleStateRecordDB(Base):
    """Tracks active model deployment, slot assignments, and rollout canary."""

    __tablename__ = "lifecycle_state"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    champion_release: Mapped[str] = mapped_column(String(64), default="R1")
    active_slot: Mapped[str] = mapped_column(String(8), default="A")
    candidate_release: Mapped[str] = mapped_column(String(64), nullable=True)
    candidate_slot: Mapped[str] = mapped_column(String(8), nullable=True)
    canary_weight: Mapped[float] = mapped_column(Float, default=0.0)
    last_action: Mapped[str] = mapped_column(String(16), default="A0")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
