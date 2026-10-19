"""DARI (Damage-Aware Retraining & Repair Identification) Decision Solver.

Implements the deterministic DARI selection policy:
  Filter Infeasible Actions -> Score Net Utility -> Tie-break Lowest Feasible Action

Invariants:
  - Actions:
      A0: No repair, continue monitoring
      A1: Hot threshold recalibration (sub-second, no retraining)
      A2: Local/targeted adaptation
      A3: Full retraining (last resort, never the default)
  - Hard constraints are strict safety barriers, not soft utility penalties.
  - Low quality (Q), small sample size (S), missing/unreliable labels (L), or transient drift (R)
    explicitly forbid unsafe retraining.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from schemas.lifecycle import DamageFingerprint, RepairAction
from swayamkavach.dari.policy_config import DARIPolicyConfig, get_policy_config

logger = logging.getLogger("swayamkavach.dari.selector")


@dataclass(frozen=True)
class SelectionResult:
    """Immutable audit record of a DARI repair selection decision."""

    chosen_action: RepairAction
    fingerprint: DamageFingerprint
    feasible_actions: list[RepairAction]
    rejection_reasons: dict[str, str]
    utility_scores: dict[str, float]
    explanation: str
    policy_version: str = "v1.0"

    def to_dict(self) -> dict[str, Any]:
        return {
            "chosen_action": self.chosen_action.value,
            "fingerprint": self.fingerprint.model_dump(),
            "feasible_actions": [a.value for a in self.feasible_actions],
            "rejection_reasons": self.rejection_reasons,
            "utility_scores": self.utility_scores,
            "explanation": self.explanation,
            "policy_version": self.policy_version,
        }


class DARISolver:
    """Deterministic policy solver selecting the minimal sufficient intervention."""

    def __init__(
        self,
        config: DARIPolicyConfig | None = None,
        q_min: float | None = None,
        s_min: int | None = None,
        s_min_retrain: int | None = None,
        s_min_adapt: int | None = None,
        l_min: float | None = None,
        r_min_for_a3: int | None = None,
        cost_weight: float | None = None,
        risk_weight: float | None = None,
        drift_threshold: float | None = None,
        boundary_threshold: float | None = None,
        severe_damage_threshold: float | None = None,
    ):
        base_cfg = config or get_policy_config()
        self.config = base_cfg
        self.policy_version = base_cfg.policy_version
        self.q_min = q_min if q_min is not None else base_cfg.q_min
        # s_min sets s_min_retrain for backward compatibility; default is 1000 from config
        self.s_min_retrain = s_min_retrain if s_min_retrain is not None else (s_min if s_min is not None else base_cfg.s_min_retrain)
        self.s_min_adapt = s_min_adapt if s_min_adapt is not None else base_cfg.s_min_adapt
        self.s_min = self.s_min_retrain
        self.l_min = l_min if l_min is not None else base_cfg.l_min
        self.r_min_for_a3 = r_min_for_a3 if r_min_for_a3 is not None else base_cfg.r_min_for_a3
        self.lambda_cost = cost_weight if cost_weight is not None else base_cfg.cost_weight
        self.gamma_risk = risk_weight if risk_weight is not None else base_cfg.risk_weight
        self.drift_threshold = drift_threshold if drift_threshold is not None else base_cfg.drift_threshold
        self.boundary_threshold = boundary_threshold if boundary_threshold is not None else base_cfg.boundary_ambiguity_threshold
        self.severe_damage_threshold = severe_damage_threshold if severe_damage_threshold is not None else base_cfg.severe_damage_threshold

        # Action nominal costs C(A_i)
        self.action_costs = {
            RepairAction.A0: base_cfg.action_costs.get("A0", 0.0),
            RepairAction.A1: base_cfg.action_costs.get("A1", 0.05),
            RepairAction.A2: base_cfg.action_costs.get("A2", 0.35),
            RepairAction.A3: base_cfg.action_costs.get("A3", 1.00),
        }

        # Action deployment risks G(A_i)
        self.action_risks = {
            RepairAction.A0: base_cfg.action_risks.get("A0", 0.0),
            RepairAction.A1: base_cfg.action_risks.get("A1", 0.05),
            RepairAction.A2: base_cfg.action_risks.get("A2", 0.30),
            RepairAction.A3: base_cfg.action_risks.get("A3", 0.60),
        }

    def filter_feasibility(
        self, fp: DamageFingerprint
    ) -> tuple[list[RepairAction], dict[str, str]]:
        """Filter out infeasible actions against hard constraints.

        Hard constraints are deterministic gates, never tradeable for utility.
        """
        feasible: list[RepairAction] = [RepairAction.A0]
        rejections: dict[str, str] = {}

        # 0. Boundary Calibration (A1) feasibility check
        # Severe covariate shift (D_X >= severe_damage_threshold) without boundary ambiguity
        # cannot be resolved by threshold movement alone.
        if fp.D_X >= self.severe_damage_threshold and fp.D_B < 0.20:
            rejections[RepairAction.A1.value] = (
                f"Severe covariate shift D_X={fp.D_X:.3f} >= {self.severe_damage_threshold:.3f} "
                f"without commensurate boundary ambiguity (D_B={fp.D_B:.3f}) precludes threshold recalibration alone."
            )
        elif fp.D_B < self.boundary_threshold:
            rejections[RepairAction.A1.value] = (
                f"Boundary damage D_B={fp.D_B:.3f} < {self.boundary_threshold:.3f}. "
                "Threshold recalibration is only applicable when decision boundary uncertainty is elevated."
            )
        else:
            feasible.append(RepairAction.A1)

        # 1. Ingestion quality constraint
        if fp.Q < self.q_min:
            rejections[RepairAction.A2.value] = (
                f"Data quality Q={fp.Q:.3f} < {self.q_min:.3f}. Ingestion noise precludes model adaptation."
            )
            rejections[RepairAction.A3.value] = (
                f"Data quality Q={fp.Q:.3f} < {self.q_min:.3f}. Ingestion noise precludes retraining."
            )
            return feasible, rejections

        # 2. Sample sufficiency constraint
        if fp.S < self.s_min_adapt:
            rejections[RepairAction.A2.value] = (
                f"Sample count S={fp.S} < {self.s_min_adapt}. Insufficient window size for local adaptation."
            )
            rejections[RepairAction.A3.value] = (
                f"Sample count S={fp.S} < {self.s_min_retrain}. Insufficient window size for full retraining (Hard Gate: S >= {self.s_min_retrain})."
            )
            return feasible, rejections
        elif fp.S < self.s_min_retrain:
            rejections[RepairAction.A3.value] = (
                f"Sample count S={fp.S} < {self.s_min_retrain}. Insufficient window size for full retraining (Hard Gate: S >= {self.s_min_retrain})."
            )

        # 3. Label reliability & availability constraint
        if fp.D_Y is None or fp.L < self.l_min:
            label_status = "unlabelled" if fp.D_Y is None else f"low reliability L={fp.L:.3f} < {self.l_min:.3f}"
            rejections[RepairAction.A2.value] = (
                f"Ground truth labels {label_status}. Supervised adaptation is unsafe without verified ground truth."
            )
            rejections[RepairAction.A3.value] = (
                f"Ground truth labels {label_status}. Supervised retraining is unsafe without verified ground truth."
            )
            return feasible, rejections

        # If data quality, samples, and labels pass, A2 is feasible
        feasible.append(RepairAction.A2)

        # 4. Persistence constraint for full retraining (A3)
        if RepairAction.A3.value not in rejections:
            if fp.R < self.r_min_for_a3:
                rejections[RepairAction.A3.value] = (
                    f"Drift persistence R={fp.R} < {self.r_min_for_a3}. Transient shift: cooldown prevents retraining churn."
                )
            else:
                feasible.append(RepairAction.A3)

        return feasible, rejections

    def compute_utilities(
        self, fp: DamageFingerprint, feasible: list[RepairAction]
    ) -> dict[str, float]:
        """Compute net utility: U(A_i) = Recovery(A_i) - lambda*Cost(A_i) - gamma*Risk(A_i)."""
        d_y = fp.D_Y if fp.D_Y is not None else 0.0
        utilities: dict[str, float] = {}

        for action in feasible:
            cost = self.action_costs[action]
            risk = self.action_risks[action]

            # Model expected recovery based on dominant damage dimension
            if action == RepairAction.A0:
                # Nominal monitoring is optimal if total damage is small
                total_damage = float(fp.D_X + d_y + fp.D_B)
                recovery = max(0.0, 1.0 - total_damage * 1.5)

            elif action == RepairAction.A1:
                # Threshold calibration specifically remedies boundary/uncertainty damage D_B.
                if fp.D_B < self.boundary_threshold:
                    recovery = 0.0
                elif fp.D_X >= self.severe_damage_threshold or d_y >= 0.15:
                    recovery = 0.20  # Ineffective against broad structural degradation
                else:
                    recovery = float(min(1.0, 0.40 + fp.D_B * 1.2))


            elif action == RepairAction.A2:
                # Local adaptation remedies localized covariate and moderate performance drift
                # If damage is broad/severe (D_X >= severe_damage_threshold or d_y >= 0.15),
                # localized adaptation is structurally insufficient.
                if fp.D_X >= self.severe_damage_threshold or d_y >= 0.15:
                    recovery = 0.35  # Sub-nominal recovery when damage is widespread
                else:
                    recovery = float(min(1.0, 0.45 + 0.80 * fp.D_X + 0.80 * d_y))

            elif action == RepairAction.A3:
                # Full retraining recovers from broad/severe structural degradation
                severe_evidence = max(fp.D_X, d_y)
                recovery = float(min(1.0, 0.70 + 0.50 * severe_evidence))
            else:
                recovery = 0.0

            net_u = recovery - (self.lambda_cost * cost) - (self.gamma_risk * risk)
            utilities[action.value] = round(net_u, 4)

        return utilities

    def select_action(self, fp: DamageFingerprint) -> SelectionResult:
        """Execute deterministic DARI repair selection."""
        feasible, rejections = self.filter_feasibility(fp)
        utilities = self.compute_utilities(fp, feasible)

        # 1. If nominal conditions hold, default to A0 immediately
        d_y = fp.D_Y if fp.D_Y is not None else 0.0
        is_nominal = (
            fp.D_X < self.drift_threshold
            and fp.D_B < self.boundary_threshold
            and d_y < 0.05
        )

        if is_nominal and RepairAction.A0 in feasible:
            chosen = RepairAction.A0
            explanation = "Nominal operating envelope: covariate and boundary shifts within safety thresholds. No compute consumed."
            return SelectionResult(
                chosen_action=chosen,
                fingerprint=fp,
                feasible_actions=feasible,
                rejection_reasons=rejections,
                utility_scores=utilities,
                explanation=explanation,
            )

        # 2. Select feasible action that maximizes utility
        # Tie-breaking order: A0 > A1 > A2 > A3 (lowest tier intervention wins on equal utility)
        priority_order = [RepairAction.A0, RepairAction.A1, RepairAction.A2, RepairAction.A3]

        best_action = feasible[0]
        best_u = -float("inf")

        # Evaluate according to priority order for deterministic tie-breaking
        for action in priority_order:
            if action in feasible:
                u = utilities.get(action.value, -float("inf"))
                if u > best_u + 1e-5:  # Strict epsilon margin required to displace lower tier
                    best_u = u
                    best_action = action

        # Formulate human-readable audit explanation
        if best_action == RepairAction.A0:
            explanation = "Damage is low or transient. Net utility favors continued monitoring (A0)."
        elif best_action == RepairAction.A1:
            explanation = f"Boundary damage D_B={fp.D_B:.3f} detected. Selected Level A1 sub-second threshold recalibration."
        elif best_action == RepairAction.A2:
            explanation = f"Localized covariate shift D_X={fp.D_X:.3f}. Selected Level A2 local adaptation."
        else:
            explanation = f"Severe structural degradation D_X={fp.D_X:.3f}, D_Y={d_y:.3f} persistent over {fp.R} windows. Selected Level A3 full retraining."

        logger.info(
            "DARI Decision: chosen=%s, feasible=%s, utilities=%s",
            best_action.value,
            [a.value for a in feasible],
            utilities,
        )

        return SelectionResult(
            chosen_action=best_action,
            fingerprint=fp,
            feasible_actions=feasible,
            rejection_reasons=rejections,
            utility_scores=utilities,
            explanation=explanation,
            policy_version=self.policy_version,
        )

    def solve(self, fp: DamageFingerprint) -> SelectionResult:
        """Alias for select_action."""
        return self.select_action(fp)

