"""Versioned DARI Policy Configuration.

Defines authoritative thresholds, feasibility gates, and utility weights
for the Damage-Aware Retraining & Repair Identification (DARI) framework.

Invariants (Preserved from Thesis & System Specification):
  - Hard Gate: Q >= 0.70 required for model repair/retraining.
  - Hard Gate: L >= 0.70 required for supervised repair/retraining.
  - Hard Gate: S >= 1000 required for A3 full retraining.
  - Hard Gate: S >= 100 required for A2 local adaptation.
  - Hard Gate: R >= 2 consecutive anomalous windows required for A3 full retraining.
  - Action A1 is designated for decision boundary ambiguity (D_B >= 0.15)
    and is infeasible for pure severe covariate drift (D_X >= 0.40) without boundary issue.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from pydantic import BaseModel, Field, model_validator

logger = logging.getLogger("swayamkavach.dari.policy_config")


class DARIPolicyConfig(BaseModel):
    """Authoritative versioned configuration for DARI repair selection."""

    policy_version: str = Field(default="v1.0", description="Policy schema version")
    q_min: float = Field(default=0.70, ge=0.0, le=1.0, description="Minimum data quality score for repair")
    s_min_retrain: int = Field(default=1000, ge=1, description="Hard gate: minimum samples for A3 retraining")
    s_min_adapt: int = Field(default=100, ge=1, description="Minimum samples for A2 localized adaptation")
    l_min: float = Field(default=0.70, ge=0.0, le=1.0, description="Hard gate: minimum label reliability for repair")
    r_min_for_a3: int = Field(default=2, ge=1, description="Hard gate: minimum persistence windows for A3 retraining")

    # Feature & damage thresholds
    drift_threshold: float = Field(default=0.25, ge=0.0, le=1.0, description="Covariate drift threshold (D_X)")
    boundary_ambiguity_threshold: float = Field(default=0.15, ge=0.0, le=1.0, description="Boundary ambiguity threshold for A1 (D_B)")
    severe_damage_threshold: float = Field(default=0.40, ge=0.0, le=1.0, description="Severe structural damage threshold (D_X or D_Y)")

    # Utility function weights: U(A) = Recovery(A) - lambda*Cost(A) - gamma*Risk(A)
    cost_weight: float = Field(default=0.25, ge=0.0, description="Lambda cost penalty weight")
    risk_weight: float = Field(default=0.20, ge=0.0, description="Gamma deployment risk penalty weight")

    # Nominal action costs C(A_i)
    action_costs: dict[str, float] = Field(
        default_factory=lambda: {
            "A0": 0.0,
            "A1": 0.05,
            "A2": 0.35,
            "A3": 1.00,
        }
    )

    # Nominal deployment risks G(A_i)
    action_risks: dict[str, float] = Field(
        default_factory=lambda: {
            "A0": 0.0,
            "A1": 0.05,
            "A2": 0.30,
            "A3": 0.60,
        }
    )

    @model_validator(mode="after")
    def validate_thresholds(self) -> DARIPolicyConfig:
        """Validate logical ordering of thresholds and limits."""
        if self.s_min_adapt > self.s_min_retrain:
            raise ValueError(f"s_min_adapt ({self.s_min_adapt}) cannot exceed s_min_retrain ({self.s_min_retrain})")
        if self.boundary_ambiguity_threshold > self.severe_damage_threshold:
            raise ValueError("boundary_ambiguity_threshold cannot exceed severe_damage_threshold")
        return self


_DEFAULT_POLICY_CONFIG: DARIPolicyConfig | None = None


def get_policy_config() -> DARIPolicyConfig:
    """Retrieve or load cached authoritative DARI policy configuration."""
    global _DEFAULT_POLICY_CONFIG
    if _DEFAULT_POLICY_CONFIG is not None:
        return _DEFAULT_POLICY_CONFIG

    policy_file = (
        Path(__file__).resolve().parent.parent.parent.parent
        / "policies"
        / "dari_policy_v1.json"
    )
    if policy_file.exists():
        try:
            with open(policy_file, encoding="utf-8") as f:
                data = json.load(f)
                _DEFAULT_POLICY_CONFIG = DARIPolicyConfig(**data)
                return _DEFAULT_POLICY_CONFIG
        except Exception as exc:
            logger.warning("Could not read policy file %s: %s; using default config", policy_file, exc)

    _DEFAULT_POLICY_CONFIG = DARIPolicyConfig()
    return _DEFAULT_POLICY_CONFIG


def save_policy_config(config: DARIPolicyConfig, target_path: Path | None = None) -> None:
    """Persist validated policy configuration to disk."""
    out_path = (
        target_path
        or Path(__file__).resolve().parent.parent.parent.parent
        / "policies"
        / "dari_policy_v1.json"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(config.model_dump(), f, indent=2)
    logger.info("Persisted DARI policy configuration to %s", out_path)
