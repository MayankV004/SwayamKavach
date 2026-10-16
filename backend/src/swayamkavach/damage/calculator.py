"""DARI 7D Damage Calculator for autonomous drift diagnostics and repair selection.

Calculates the explicit 7-dimensional DARI fingerprint:
  F_t = [D_X, D_Y, D_B, Q, L, S, R]
Where:
  - D_X: Distribution damage (2-sample Kolmogorov-Smirnov test across numerical features).
  - D_Y: Performance degradation (attack recall drop & FPR inflation on delayed labels; None if unlabelled).
  - D_B: Decision boundary / uncertainty damage (margin ambiguity around theta +- 0.10 & prediction entropy).
  - Q: Ingestion data quality score (completeness, nullness, schema conformance).
  - L: Label reliability & verification freshness score.
  - S: Sample sufficiency count in monitoring window.
  - R: Persistence count of consecutive anomalous windows.
"""

from __future__ import annotations

import logging
from collections.abc import Sequence

from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import ks_2samp

from schemas.lifecycle import DamageFingerprint

logger = logging.getLogger("swayamkavach.damage")

DEFAULT_NUMERICAL_FEATURES = [
    "duration",
    "src_bytes",
    "dst_bytes",
    "src_ip_bytes",
    "dst_ip_bytes",
    "src_pkts",
    "dst_pkts",
    "missed_bytes",
]

_DEFAULT_REFERENCE_DF: pd.DataFrame | None = None


def get_default_reference_df() -> pd.DataFrame | None:
    """Lazily load a sample of processed validation baseline features for distribution drift."""
    global _DEFAULT_REFERENCE_DF
    if _DEFAULT_REFERENCE_DF is not None:
        return _DEFAULT_REFERENCE_DF
    try:
        backend_dir = Path(__file__).resolve().parent.parent.parent.parent
        val_path = backend_dir / "data" / "processed" / "val.csv.gz"
        if val_path.exists():
            _DEFAULT_REFERENCE_DF = pd.read_csv(val_path, nrows=1000)
            return _DEFAULT_REFERENCE_DF
    except Exception as exc:
        logger.warning("Could not load default reference dataset: %s", exc)
    return None


class DamageCalculator:
    """Calculates multidimensional drift, uncertainty, and performance degradation."""

    def __init__(
        self,
        reference_df: pd.DataFrame | None = None,
        feature_columns: Sequence[str] | None = None,
        decision_threshold: float = 0.42,
        margin_band: float = 0.10,
        baseline_recall: float = 0.998,
        baseline_fpr: float = 0.008,
    ):
        self.reference_df = reference_df if reference_df is not None else get_default_reference_df()
        self.feature_columns = list(feature_columns or DEFAULT_NUMERICAL_FEATURES)
        self.decision_threshold = decision_threshold
        self.margin_band = margin_band
        self.baseline_recall = baseline_recall
        self.baseline_fpr = baseline_fpr

    def compute_distribution_drift(
        self,
        current_df: pd.DataFrame,
        reference_df: pd.DataFrame | None = None,
    ) -> float:
        """Compute D_X: Kolmogorov-Smirnov test across numerical features."""
        ref = reference_df if reference_df is not None else self.reference_df
        if ref is None or len(ref) == 0 or len(current_df) == 0:
            logger.warning("Empty reference or current dataframe; returning D_X = 0.0")
            return 0.0

        ks_statistics = []
        for col in self.feature_columns:
            if col in ref.columns and col in current_df.columns:
                ref_vals = pd.to_numeric(ref[col], errors="coerce").dropna().values
                curr_vals = pd.to_numeric(current_df[col], errors="coerce").dropna().values

                if len(ref_vals) > 0 and len(curr_vals) > 0:
                    res = ks_2samp(ref_vals, curr_vals)
                    ks_statistics.append(float(res.statistic))

        if not ks_statistics:
            return 0.0

        # Weighted aggregate: 70% average KS drift + 30% peak feature KS drift
        avg_ks = float(np.mean(ks_statistics))
        max_ks = float(np.max(ks_statistics))
        d_x = float(0.70 * avg_ks + 0.30 * max_ks)
        return float(np.clip(round(d_x, 4), 0.0, 1.0))

    def compute_boundary_damage(
        self,
        scores: np.ndarray | Sequence[float],
        threshold: float | None = None,
    ) -> float:
        """Compute D_B: Margin ambiguity around threshold and Shannon prediction entropy."""
        scores_arr = np.asarray(scores, dtype=float)
        if len(scores_arr) == 0:
            return 0.0

        theta = threshold if threshold is not None else self.decision_threshold
        lower_bound = max(0.0, theta - self.margin_band)
        upper_bound = min(1.0, theta + self.margin_band)

        # 1. Ambiguity band: proportion of predictions falling within theta +- margin_band
        ambiguity_mask = (scores_arr >= lower_bound) & (scores_arr <= upper_bound)
        ambiguity_ratio = float(np.mean(ambiguity_mask))

        # 2. Shannon binary entropy: H(p) = - [p*log2(p) + (1-p)*log2(1-p)]
        eps = 1e-12
        p = np.clip(scores_arr, eps, 1.0 - eps)
        entropy = -(p * np.log2(p) + (1.0 - p) * np.log2(1.0 - p))
        mean_entropy = float(np.mean(entropy))  # Already in [0.0, 1.0] since max binary entropy is 1.0

        # Combine: 60% ambiguity band + 40% entropy
        d_b = float(0.60 * ambiguity_ratio + 0.40 * mean_entropy)
        return float(np.clip(round(d_b, 4), 0.0, 1.0))

    def compute_performance_damage(
        self,
        y_true: Sequence[int | None] | np.ndarray | None,
        scores_or_preds: Sequence[float | int] | np.ndarray | None,
        threshold: float | None = None,
    ) -> float | None:
        """Compute D_Y: Attack recall drop & False Positive Rate inflation on available labels.

        Returns None if labels are absent (DARI invariant: unlabelled windows have D_Y = None).
        Safely aligns partial label arrays with predicted scores without IndexError.
        """
        if y_true is None or len(y_true) == 0 or scores_or_preds is None or len(scores_or_preds) == 0:
            return None

        # Filter indices where y_true is valid and not None / NaN
        valid_indices = [i for i, y in enumerate(y_true) if y is not None and not pd.isna(y)]
        if not valid_indices:
            return None

        scores_arr = np.asarray(scores_or_preds, dtype=float)

        # If y_true matches scores length, extract exactly aligned valid pairs
        if len(y_true) == len(scores_arr):
            y_true_arr = np.array([y_true[i] for i in valid_indices], dtype=int)
            scores_eval = scores_arr[valid_indices]
        else:
            # If lengths differ (e.g. pre-filtered label subset), align up to available length
            eval_len = min(len(y_true), len(scores_arr))
            y_true_arr = np.asarray(y_true[:eval_len], dtype=int)
            scores_eval = scores_arr[:eval_len]

        if len(y_true_arr) == 0 or len(scores_eval) == 0:
            return None

        theta = threshold if threshold is not None else self.decision_threshold
        # If float scores, threshold them into binary predictions; if already 0/1 integers, keep
        if np.any((scores_eval > 0.0) & (scores_eval < 1.0)):
            y_pred = (scores_eval >= theta).astype(int)
        else:
            y_pred = scores_eval.astype(int)

        # Compute Attack Recall (Class == 1)
        attack_mask = (y_true_arr == 1)
        if np.any(attack_mask):
            curr_recall = float(np.mean(y_pred[attack_mask] == 1))
        else:
            curr_recall = self.baseline_recall

        # Compute Normal FPR (Class == 0)
        normal_mask = (y_true_arr == 0)
        if np.any(normal_mask):
            curr_fpr = float(np.mean(y_pred[normal_mask] == 1))
        else:
            curr_fpr = self.baseline_fpr

        # Calculate degradation relative to baseline
        recall_drop = max(0.0, self.baseline_recall - curr_recall)
        fpr_inflation = max(0.0, curr_fpr - self.baseline_fpr)

        # Performance damage is highest observed safety breach
        d_y = float(max(recall_drop, fpr_inflation))
        return float(np.clip(round(d_y, 4), 0.0, 1.0))

    def compute_data_quality(self, current_df: pd.DataFrame) -> float:
        """Compute Q: Data quality score (completeness, non-null, schema conformance)."""
        if len(current_df) == 0:
            return 0.0

        missing_feature_penalties = 0.0
        for col in self.feature_columns:
            if col not in current_df.columns:
                missing_feature_penalties += 0.10

        # Check null rate
        available_cols = [c for c in self.feature_columns if c in current_df.columns]
        if available_cols:
            null_rate = float(current_df[available_cols].isna().mean().mean())
        else:
            null_rate = 1.0

        quality = 1.0 - null_rate - missing_feature_penalties
        return float(np.clip(round(quality, 4), 0.0, 1.0))

    def compute_fingerprint(
        self,
        current_df: pd.DataFrame,
        scores: np.ndarray | Sequence[float],
        y_true: Sequence[int] | np.ndarray | None = None,
        reference_df: pd.DataFrame | None = None,
        threshold: float | None = None,
        label_reliability: float = 0.95,
        persistence_count: int = 1,
    ) -> DamageFingerprint:
        """Assemble full 7D Damage Fingerprint F_t = [D_X, D_Y, D_B, Q, L, S, R]."""
        d_x = self.compute_distribution_drift(current_df, reference_df=reference_df)
        d_b = self.compute_boundary_damage(scores, threshold=threshold)
        d_y = self.compute_performance_damage(y_true, scores, threshold=threshold)
        q = self.compute_data_quality(current_df)
        s = int(len(current_df))
        l_score = float(np.clip(round(label_reliability if y_true is not None else 0.0, 4), 0.0, 1.0))
        r = max(1, int(persistence_count))

        return DamageFingerprint(
            D_X=d_x,
            D_Y=d_y,
            D_B=d_b,
            Q=q,
            L=l_score,
            S=s,
            R=r,
        )
