"""Level A1 Decision Threshold Recalibrator.

Performs sub-second hot threshold calibration without retraining the model.
Maximizes Youden's Index (Recall - FPR) subject to hard security constraints:
  - Critical Attack Recall >= 0.98
  - False Positive Rate <= 0.02
"""

from __future__ import annotations

import logging
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

import numpy as np

logger = logging.getLogger("swayamkavach.dari.calibrator")


@dataclass(frozen=True)
class CalibrationResult:
    """Outcome of Level A1 threshold recalibration."""

    old_threshold: float
    new_threshold: float
    recall: float
    fpr: float
    f1: float
    samples_evaluated: int
    meets_constraints: bool
    status: str = "SUCCESS"

    def to_dict(self) -> dict[str, Any]:
        return {
            "old_threshold": self.old_threshold,
            "new_threshold": self.new_threshold,
            "recall": self.recall,
            "fpr": self.fpr,
            "f1": self.f1,
            "samples_evaluated": self.samples_evaluated,
            "meets_constraints": self.meets_constraints,
            "status": self.status,
        }


class ThresholdCalibrator:
    """Finds optimal decision boundary theta* satisfying security safety gates."""

    def __init__(
        self,
        min_recall: float = 0.98,
        max_fpr: float = 0.02,
        grid_resolution: int = 81,
    ):
        self.min_recall = min_recall
        self.max_fpr = max_fpr
        self.grid = np.linspace(0.10, 0.90, grid_resolution)

    def calibrate(
        self,
        y_true: Sequence[int] | np.ndarray | None = None,
        scores: Sequence[float] | np.ndarray = (),
        current_threshold: float = 0.42,
        labels: Sequence[int] | np.ndarray | None = None,
    ) -> CalibrationResult:
        """Evaluate candidate thresholds on labelled samples to find optimal theta*."""
        actual_labels = y_true if y_true is not None else (labels if labels is not None else [])
        y_arr = np.asarray(actual_labels, dtype=int) if len(actual_labels) > 0 else np.array([], dtype=int)
        s_arr = np.asarray(scores, dtype=float) if len(scores) > 0 else np.array([], dtype=float)

        if len(y_arr) == 0 or len(s_arr) == 0:
            logger.warning("Empty validation data passed to calibrator; returning INSUFFICIENT_DATA.")
            return CalibrationResult(
                old_threshold=current_threshold,
                new_threshold=current_threshold,
                recall=0.0,
                fpr=0.0,
                f1=0.0,
                samples_evaluated=0,
                meets_constraints=False,
                status="INSUFFICIENT_DATA",
            )

        attack_mask = (y_arr == 1)
        normal_mask = (y_arr == 0)

        n_attacks = int(np.sum(attack_mask))
        n_normals = int(np.sum(normal_mask))

        if n_attacks == 0 or n_normals == 0:
            logger.warning("Single-class sample passed to calibrator; returning SINGLE_CLASS_INSUFFICIENT.")
            return CalibrationResult(
                old_threshold=current_threshold,
                new_threshold=current_threshold,
                recall=0.0,
                fpr=0.0,
                f1=0.0,
                samples_evaluated=len(y_arr),
                meets_constraints=False,
                status="SINGLE_CLASS_INSUFFICIENT",
            )

        best_theta = current_threshold
        best_score = -float("inf")
        best_metrics = (0.0, 1.0, 0.0)
        found_constrained = False

        for theta in self.grid:
            y_pred = (s_arr >= theta).astype(int)
            tp = int(np.sum((y_pred == 1) & attack_mask))
            fp = int(np.sum((y_pred == 1) & normal_mask))
            fn = int(np.sum((y_pred == 0) & attack_mask))

            recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
            fpr = float(fp / n_normals) if n_normals > 0 else 0.0
            precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
            f1 = float(2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

            # Check hard constraints
            constrained = (recall >= self.min_recall) and (fpr <= self.max_fpr)
            youden_j = recall - fpr

            if constrained:
                if not found_constrained or youden_j > best_score:
                    found_constrained = True
                    best_score = youden_j
                    best_theta = float(theta)
                    best_metrics = (recall, fpr, f1)
            elif not found_constrained:
                # Fallback: find threshold closest to satisfying min_recall
                if youden_j > best_score:
                    best_score = youden_j
                    best_theta = float(theta)
                    best_metrics = (recall, fpr, f1)

        status_str = "SUCCESS" if found_constrained else "NO_FEASIBLE_THRESHOLD"

        result = CalibrationResult(
            old_threshold=float(current_threshold),
            new_threshold=round(best_theta, 4),
            recall=round(best_metrics[0], 4),
            fpr=round(best_metrics[1], 4),
            f1=round(best_metrics[2], 4),
            samples_evaluated=len(y_arr),
            meets_constraints=found_constrained,
            status=status_str,
        )

        logger.info(
            "Recalibration complete: old=%.3f -> new=%.3f (Recall=%.4f, FPR=%.4f, F1=%.4f)",
            result.old_threshold,
            result.new_threshold,
            result.recall,
            result.fpr,
            result.f1,
        )
        return result
