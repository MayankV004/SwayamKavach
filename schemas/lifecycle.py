"""DARI lifecycle, damage fingerprint, and repair selection schemas."""

from datetime import UTC, datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field


class RepairAction(StrEnum):
    """Preserved DARI repair actions."""
    A0 = "A0"  # No repair; continue monitoring if security behavior remains acceptable
    A1 = "A1"  # Threshold adjustment or calibration
    A2 = "A2"  # Local/targeted adaptation when evidence and data are sufficient
    A3 = "A3"  # Full retraining for broad/severe degradation with sufficient suitable data


class EvaluationVerdict(StrEnum):
    """Preserved candidate evaluation states."""
    PASS = "PASS"
    FAIL = "FAIL"
    INCONCLUSIVE = "INCONCLUSIVE"


class DamageFingerprint(BaseModel):
    """Explicit DARI damage fingerprint representing multidimensional drift and degradation."""

    D_X: float = Field(..., ge=0.0, le=1.0, description="Distribution damage (e.g. KS-test or drift share)")
    D_Y: float | None = Field(default=None, ge=0.0, le=1.0, description="Performance damage (when labels available)")
    D_B: float = Field(..., ge=0.0, le=1.0, description="Boundary/uncertainty damage (e.g. prediction entropy)")
    Q: float = Field(..., ge=0.0, le=1.0, description="Data quality score (completeness, nullness, schema conformity)")
    L: float = Field(..., ge=0.0, le=1.0, description="Label reliability / delay freshness score")
    S: int = Field(..., ge=0, description="Sample sufficiency count in current window")
    R: int = Field(default=1, ge=1, description="Persistence: consecutive windows drift is observed")


class LifecycleState(BaseModel):
    """Durable state of the SwayamKavach autonomous lifecycle."""

    champion_release: str = Field(..., description="Currently active production champion model release (e.g., R1)")
    active_slot: Literal["A", "B"] = Field(..., description="Slot currently serving champion traffic")
    candidate_release: str | None = Field(default=None, description="Under-evaluation candidate release")
    candidate_slot: Literal["A", "B"] | None = Field(default=None, description="Slot assigned to candidate during canary")
    canary_weight: float = Field(default=0.0, ge=0.0, le=1.0, description="Traffic share routed to candidate (0.0 to 1.0)")
    last_fingerprint: DamageFingerprint | None = Field(default=None, description="Most recent damage fingerprint")
    chosen_action: RepairAction | None = Field(default=None, description="Last selected DARI action")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC), description="Last update timestamp")
