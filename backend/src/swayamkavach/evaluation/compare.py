"""Paired statistical model comparison and non-regression safety gates.

Implements Phase 6 Candidate Evaluation:
  1. Evaluates Champion vs Candidate on identical validation splits.
  2. Runs paired statistical tests (McNemar's test) for significance.
  3. Enforces deterministic hard non-regression safety gates on critical attack classes and FPR.
  4. Yields strictly typed verdicts: PASS, FAIL, INCONCLUSIVE.
  5. Produces immutable evaluation reports with cryptographic approval hash.
"""

from __future__ import annotations

import hashlib
import logging
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import numpy as np
import pandas as pd
from scipy.stats import chi2
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

from schemas.lifecycle import EvaluationVerdict

logger = logging.getLogger("swayamkavach.evaluation.compare")

CRITICAL_ATTACK_CLASSES = ["backdoor", "ddos", "dos", "injection", "xss"]


@dataclass(frozen=True)
class EvaluationReport:
    """Immutable audit report of candidate vs champion evaluation."""

    report_id: str
    champion_release: str
    candidate_release: str
    verdict: EvaluationVerdict
    p_value: float
    statistically_significant: bool
    rejection_reasons: list[str]
    champion_metrics: dict[str, float]
    candidate_metrics: dict[str, float]
    per_class_recall_comparison: dict[str, dict[str, float]]
    evaluated_samples: int
    approval_hash: str
    created_at: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "report_id": self.report_id,
            "champion_release": self.champion_release,
            "candidate_release": self.candidate_release,
            "verdict": self.verdict.value,
            "p_value": self.p_value,
            "statistically_significant": self.statistically_significant,
            "rejection_reasons": self.rejection_reasons,
            "champion_metrics": self.champion_metrics,
            "candidate_metrics": self.candidate_metrics,
            "per_class_recall_comparison": self.per_class_recall_comparison,
            "evaluated_samples": self.evaluated_samples,
            "approval_hash": self.approval_hash,
            "created_at": self.created_at,
        }


class ModelComparator:
    """Performs paired statistical evaluation and enforces safety acceptance gates."""

    def __init__(
        self,
        max_fpr: float = 0.015,
        min_overall_recall: float = 0.980,
        max_critical_recall_drop: float = 0.005,
        pr_auc_drop_tolerance: float = 0.010,
        significance_alpha: float = 0.05,
        min_samples_for_pass: int = 100,
    ):
        self.max_fpr = max_fpr
        self.min_overall_recall = min_overall_recall
        self.max_critical_recall_drop = max_critical_recall_drop
        self.pr_auc_drop_tolerance = pr_auc_drop_tolerance
        self.significance_alpha = significance_alpha
        self.min_samples_for_pass = min_samples_for_pass

    def evaluate_pipeline(
        self,
        pipeline: Any,
        features_df: pd.DataFrame,
        y_true: np.ndarray,
        threshold: float = 0.42,
    ) -> tuple[np.ndarray, np.ndarray, dict[str, float]]:
        """Score dataset and compute full evaluation metrics."""
        scores = pipeline.predict_proba(features_df)[:, 1]
        preds = (scores >= threshold).astype(int)

        acc = float(accuracy_score(y_true, preds))
        rec = float(recall_score(y_true, preds, zero_division=0))
        prec = float(precision_score(y_true, preds, zero_division=0))
        f1 = float(f1_score(y_true, preds, zero_division=0))

        tn, fp, fn, tp = confusion_matrix(y_true, preds, labels=[0, 1]).ravel()
        fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

        try:
            pr_auc = float(average_precision_score(y_true, scores))
            roc_auc = float(roc_auc_score(y_true, scores))
        except Exception:
            pr_auc = 0.0
            roc_auc = 0.0

        metrics = {
            "accuracy": round(acc, 4),
            "recall": round(rec, 4),
            "precision": round(prec, 4),
            "f1": round(f1, 4),
            "fpr": round(fpr, 4),
            "pr_auc": round(pr_auc, 4),
            "roc_auc": round(roc_auc, 4),
            "tp": int(tp),
            "fp": int(fp),
            "tn": int(tn),
            "fn": int(fn),
        }
        return preds, scores, metrics

    def compute_mcnemar_p_value(
        self, y_true: np.ndarray, preds_champ: np.ndarray, preds_cand: np.ndarray
    ) -> float:
        """Compute paired McNemar test p-value between champion and candidate predictions."""
        champ_correct = (preds_champ == y_true)
        cand_correct = (preds_cand == y_true)

        # b = champ correct, cand incorrect (discordant)
        # c = champ incorrect, cand correct (discordant)
        b = int(np.sum(champ_correct & (~cand_correct)))
        c = int(np.sum((~champ_correct) & cand_correct))

        total_discordant = b + c
        if total_discordant == 0:
            # Identical performance
            return 1.0

        # Edwards continuity-corrected McNemar chi-squared: (|b - c| - 1)^2 / (b + c)
        chi2_stat = float(((abs(b - c) - 1.0) ** 2) / total_discordant)
        p_val = float(chi2.sf(chi2_stat, df=1))
        return round(p_val, 5)

    def compare_from_probabilities(
        self,
        y_true: np.ndarray,
        champ_probs: np.ndarray,
        cand_probs: np.ndarray,
        attack_types: Sequence[str] | np.ndarray | None = None,
        champion_release: str = "R1",
        candidate_release: str = "R2-candidate",
        champion_threshold: float = 0.42,
        candidate_threshold: float = 0.42,
    ) -> EvaluationReport:
        """Execute paired comparison directly from probability arrays."""
        champ_preds = (champ_probs >= champion_threshold).astype(int)
        cand_preds = (cand_probs >= candidate_threshold).astype(int)

        def _metrics_from_preds(scores: np.ndarray, preds: np.ndarray) -> dict[str, float]:
            acc = float(accuracy_score(y_true, preds))
            rec = float(recall_score(y_true, preds, zero_division=0))
            prec = float(precision_score(y_true, preds, zero_division=0))
            f1 = float(f1_score(y_true, preds, zero_division=0))
            tn, fp, fn, tp = confusion_matrix(y_true, preds, labels=[0, 1]).ravel()
            fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
            try:
                pr_auc = float(average_precision_score(y_true, scores))
                roc_auc = float(roc_auc_score(y_true, scores))
            except Exception:
                pr_auc = 0.0
                roc_auc = 0.0
            return {
                "accuracy": round(acc, 4),
                "recall": round(rec, 4),
                "precision": round(prec, 4),
                "f1": round(f1, 4),
                "fpr": round(fpr, 4),
                "pr_auc": round(pr_auc, 4),
                "roc_auc": round(roc_auc, 4),
                "tp": int(tp),
                "fp": int(fp),
                "tn": int(tn),
                "fn": int(fn),
            }

        champ_metrics = _metrics_from_preds(champ_probs, champ_preds)
        cand_metrics = _metrics_from_preds(cand_probs, cand_preds)

        # Compute per-attack-class recall comparison
        per_class: dict[str, dict[str, float]] = {}
        if attack_types is not None:
            types_arr = np.asarray(attack_types)
            unique_attacks = sorted(set(types_arr))
            for attack in unique_attacks:
                if attack == "normal":
                    continue
                mask = (types_arr == attack)
                if np.any(mask):
                    rec_champ = float(np.mean(champ_preds[mask] == 1))
                    rec_cand = float(np.mean(cand_preds[mask] == 1))
                    per_class[str(attack)] = {
                        "champion_recall": round(rec_champ, 4),
                        "candidate_recall": round(rec_cand, 4),
                        "delta": round(rec_cand - rec_champ, 4),
                    }

        # Run McNemar statistical test
        p_val = self.compute_mcnemar_p_value(y_true, champ_preds, cand_preds)
        is_significant = bool(p_val < self.significance_alpha)

        # ----------------- Non-Regression Hard Safety Gates -----------------
        rejections: list[str] = []

        # Gate 1: Candidate FPR Limit
        if cand_metrics["fpr"] > self.max_fpr:
            rejections.append(
                f"Gate FPR Breach: Candidate FPR={cand_metrics['fpr']:.4f} exceeds limit {self.max_fpr:.4f}"
            )

        # Gate 2: Candidate Overall Recall Limit
        if cand_metrics["recall"] < self.min_overall_recall:
            rejections.append(
                f"Gate Recall Breach: Candidate Recall={cand_metrics['recall']:.4f} below floor {self.min_overall_recall:.4f}"
            )

        # Gate 3: Critical Attack Class Recall Non-Regression
        for critical_attack in CRITICAL_ATTACK_CLASSES:
            if critical_attack in per_class:
                info = per_class[critical_attack]
                if info["delta"] < -self.max_critical_recall_drop:
                    rejections.append(
                        f"Gate Critical Regression ({critical_attack}): Candidate recall dropped by {abs(info['delta'])*100:.2f}% "
                        f"(Champ: {info['champion_recall']:.4f}, Cand: {info['candidate_recall']:.4f})"
                    )

        # Gate 4: PR-AUC Degradation Tolerance
        if cand_metrics["pr_auc"] < (champ_metrics["pr_auc"] - self.pr_auc_drop_tolerance):
            rejections.append(
                f"Gate PR-AUC Regression: Candidate PR-AUC={cand_metrics['pr_auc']:.4f} < Champ PR-AUC={champ_metrics['pr_auc']:.4f}"
            )

        # ----------------- Determine Verdict -----------------
        if rejections:
            verdict = EvaluationVerdict.FAIL
        elif len(y_true) < self.min_samples_for_pass:
            verdict = EvaluationVerdict.INCONCLUSIVE
            rejections.append(f"Insufficient evaluation samples N={len(y_true)} < {self.min_samples_for_pass}")
        elif cand_metrics["f1"] < champ_metrics["f1"] - 0.01:
            verdict = EvaluationVerdict.FAIL
            rejections.append("Candidate F1 degraded below champion tolerance")
        elif not is_significant and cand_metrics["f1"] < champ_metrics["f1"]:
            verdict = EvaluationVerdict.INCONCLUSIVE
            rejections.append("Candidate degraded below champion without statistical confidence")
        else:
            verdict = EvaluationVerdict.PASS

        # Generate cryptographic approval hash
        now_str = datetime.now(UTC).isoformat()
        approval_payload = f"{champion_release}|{candidate_release}|{verdict.value}|{cand_metrics['f1']}|{cand_metrics['fpr']}|{now_str}"
        approval_hash = hashlib.sha256(approval_payload.encode("utf-8")).hexdigest()
        report_id = f"EVAL_{champion_release}_{candidate_release}_{approval_hash[:8]}"

        report = EvaluationReport(
            report_id=report_id,
            champion_release=champion_release,
            candidate_release=candidate_release,
            verdict=verdict,
            p_value=p_val,
            statistically_significant=is_significant,
            rejection_reasons=rejections,
            champion_metrics=champ_metrics,
            candidate_metrics=cand_metrics,
            per_class_recall_comparison=per_class,
            evaluated_samples=len(y_true),
            approval_hash=approval_hash,
            created_at=now_str,
        )

        logger.info(
            "Evaluation complete: %s vs %s -> Verdict: %s (p=%.5f, rejections=%d)",
            champion_release,
            candidate_release,
            verdict.value,
            p_val,
            len(rejections),
        )
        return report

    def compare(
        self,
        champion_pipeline: Any,
        candidate_pipeline: Any,
        val_df: pd.DataFrame,
        champion_release: str = "R1",
        candidate_release: str = "R2-candidate",
        champion_threshold: float = 0.42,
        candidate_threshold: float = 0.42,
    ) -> EvaluationReport:
        """Execute paired comparison, check safety gates, and determine verdict."""
        # Validate labels strictly: do NOT silently convert NaN or unparseable labels to benign class 0
        raw_labels = pd.to_numeric(val_df["label"], errors="coerce")
        valid_mask = raw_labels.notna() & raw_labels.isin([0, 1])
        unlabeled_count = int((~valid_mask).sum())

        if unlabeled_count > 0:
            logger.warning(
                "Evaluation dataset contains %d missing, non-binary, or unparseable labels; dropping them from paired evaluation.",
                unlabeled_count,
            )
            valid_df = val_df.loc[valid_mask].reset_index(drop=True)
            y_true = raw_labels[valid_mask].astype(int).values
        else:
            valid_df = val_df.copy()
            y_true = raw_labels.astype(int).values

        # If remaining valid samples are insufficient or single-class, return INCONCLUSIVE
        if len(y_true) < self.min_samples_for_pass or len(set(y_true)) < 2:
            reasons: list[str] = []
            if len(y_true) < self.min_samples_for_pass:
                reasons.append(
                    f"Insufficient evaluation samples N={len(y_true)} < {self.min_samples_for_pass} "
                    f"({unlabeled_count} missing/invalid labels excluded)"
                )
            if len(set(y_true)) < 2:
                reasons.append(
                    f"Single-class validation slice observed (classes: {set(y_true)}). "
                    "Evaluation requires both attack and benign classes."
                )

            now_str = datetime.now(UTC).isoformat()
            approval_payload = f"{champion_release}|{candidate_release}|INCONCLUSIVE|0.0|0.0|{now_str}"
            approval_hash = hashlib.sha256(approval_payload.encode("utf-8")).hexdigest()
            report_id = f"EVAL_{champion_release}_{candidate_release}_{approval_hash[:8]}"

            empty_metrics = {
                "accuracy": 0.0, "recall": 0.0, "precision": 0.0, "f1": 0.0,
                "fpr": 0.0, "pr_auc": 0.0, "roc_auc": 0.0, "tp": 0, "fp": 0, "tn": 0, "fn": 0,
            }
            return EvaluationReport(
                report_id=report_id,
                champion_release=champion_release,
                candidate_release=candidate_release,
                verdict=EvaluationVerdict.INCONCLUSIVE,
                p_value=1.0,
                statistically_significant=False,
                rejection_reasons=reasons,
                champion_metrics=empty_metrics,
                candidate_metrics=empty_metrics,
                per_class_recall_comparison={},
                evaluated_samples=len(y_true),
                approval_hash=approval_hash,
                created_at=now_str,
            )

        attack_types = (
            valid_df["type"].fillna("normal").values if "type" in valid_df.columns else None
        )

        feature_cols = [
            c for c in valid_df.columns
            if c not in ["label", "type", "src_ip", "dst_ip", "src_port", "dst_port"]
        ]
        features_df = valid_df[feature_cols]

        champ_probs = champion_pipeline.predict_proba(features_df)[:, 1]
        cand_probs = candidate_pipeline.predict_proba(features_df)[:, 1]

        return self.compare_from_probabilities(
            y_true=y_true,
            champ_probs=champ_probs,
            cand_probs=cand_probs,
            attack_types=attack_types,
            champion_release=champion_release,
            candidate_release=candidate_release,
            champion_threshold=champion_threshold,
            candidate_threshold=candidate_threshold,
        )

