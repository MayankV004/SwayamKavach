"""SQLAlchemy ORM models for durable system state."""

from datetime import UTC, datetime

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
    received_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

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
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

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
    predicted_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

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
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
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
    last_action: Mapped[str] = mapped_column(String(128), default="A0")
    last_fingerprint: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))


class GroundTruthLabelRecordDB(Base):
    """Stores delayed ground-truth labels for offline evaluation and DARI damage estimation."""

    __tablename__ = "ground_truth_labels"

    event_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    label: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    attack_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source: Mapped[str] = mapped_column(String(64), default="analyst_verification")
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    received_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC), index=True)


class WindowDamageHistoryDB(Base):
    """Tracks historical window damage metrics for temporal persistence (R) calculation."""

    __tablename__ = "window_damage_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    window_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    d_x: Mapped[float] = mapped_column(Float, nullable=False)
    d_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    d_b: Mapped[float] = mapped_column(Float, nullable=False)
    q: Mapped[float] = mapped_column(Float, nullable=False)
    l: Mapped[float] = mapped_column(Float, nullable=False)  # noqa: E741
    s: Mapped[int] = mapped_column(Integer, nullable=False)
    is_anomalous: Mapped[bool] = mapped_column(Boolean, nullable=False)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC), index=True)


class ApprovedEvaluationRecordDB(Base):
    """Cryptographically verifiable and persisted evaluation approval record."""

    __tablename__ = "approved_evaluations"

    report_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    candidate_release_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    champion_release_id: Mapped[str] = mapped_column(String(64), nullable=False)
    verdict: Mapped[str] = mapped_column(String(32), nullable=False)
    candidate_sha256: Mapped[str] = mapped_column(String(128), nullable=False)
    approval_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    operator_id: Mapped[str] = mapped_column(String(128), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))


