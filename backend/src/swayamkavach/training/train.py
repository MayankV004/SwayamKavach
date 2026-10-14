"""Baseline IDS model training, comparison, threshold calibration, and R1 release packaging.

Implements Phase 1 baseline modeling:
1. Fits DecisionTree, HistGradientBoosting, and LightGBM on train.csv.gz.
2. Compares PR-AUC, ROC-AUC, Recall, FPR, F1, and per-attack-class sensitivity on val.csv.gz.
3. Calibrates optimal decision threshold theta* on validation data.
4. Evaluates champion model on test_sealed.csv.gz.
5. Packages Release R1 bundle (pipeline.joblib + manifest.json) to releases/R1/.
"""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeClassifier

logger = logging.getLogger("swayamkavach.training.train")

CATEGORICAL_FEATURES = ["proto", "service", "conn_state"]
NUMERICAL_FEATURES = [
    "duration",
    "src_bytes",
    "dst_bytes",
    "src_ip_bytes",
    "dst_ip_bytes",
    "src_pkts",
    "dst_pkts",
    "missed_bytes",
]
ALL_FEATURES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES


def compute_sha256(file_path: Path) -> str:
    """Compute SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(1024 * 1024):
            sha256.update(chunk)
    return sha256.hexdigest()


def compute_classification_metrics(
    y_true: np.ndarray,
    y_proba: np.ndarray,
    threshold: float = 0.50,
) -> dict[str, float]:
    """Compute comprehensive IDS classification metrics."""
    y_pred = (y_proba >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

    return {
        "threshold": float(threshold),
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "fpr": float(fpr),
        "roc_auc": float(roc_auc_score(y_true, y_proba)),
        "pr_auc": float(average_precision_score(y_true, y_proba)),
        "tp": int(tp),
        "fp": int(fp),
        "tn": int(tn),
        "fn": int(fn),
    }


def compute_per_attack_recall(
    df: pd.DataFrame,
    y_proba: np.ndarray,
    threshold: float = 0.50,
) -> dict[str, float]:
    """Compute recall broken down across individual attack categories."""
    y_pred = (y_proba >= threshold).astype(int)
    results = {}

    for attack_type, group in df.groupby("type"):
        idx = group.index
        true_labels = df.loc[idx, "label"].values
        preds = y_pred[idx]

        if attack_type == "normal":
            # For normal traffic, specificity (1 - FPR) is the relevant metric
            results[attack_type] = float(np.mean(preds == 0))
        else:
            results[attack_type] = float(recall_score(true_labels, preds, zero_division=0))

    return results


def calibrate_threshold(
    y_true: np.ndarray,
    y_proba: np.ndarray,
    max_acceptable_fpr: float = 0.05,
) -> float:
    """Find decision threshold theta* optimizing F1 subject to FPR <= max_acceptable_fpr."""
    best_threshold = 0.50
    best_f1 = -1.0

    for thresh in np.arange(0.10, 0.92, 0.02):
        y_pred = (y_proba >= thresh).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0

        if fpr <= max_acceptable_fpr:
            f1 = f1_score(y_true, y_pred, zero_division=0)
            if f1 > best_f1:
                best_f1 = f1
                best_threshold = float(thresh)

    return round(best_threshold, 2)


def build_preprocessing_pipeline() -> ColumnTransformer:
    """Create tabular preprocessor with explicit categorical encoding."""
    return ColumnTransformer(
        transformers=[
            ("num", "passthrough", NUMERICAL_FEATURES),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
        ]
    )


def train_and_evaluate(
    data_dir: Path,
    releases_dir: Path,
    manifest_path: Path,
    target_release: str = "R1",
) -> dict[str, Any]:
    """Train baseline estimators, select champion, and package release bundle."""
    logger.info("Loading train, val, and sealed test partitions...")
    train_df = pd.read_csv(data_dir / "train.csv.gz")
    val_df = pd.read_csv(data_dir / "val.csv.gz")
    test_df = pd.read_csv(data_dir / "test_sealed.csv.gz")

    x_train = train_df[ALL_FEATURES]
    y_train = train_df["label"].values

    # Reset indices to ensure positional alignment with probability arrays
    val_df = val_df.reset_index(drop=True)
    test_df = test_df.reset_index(drop=True)

    x_val = val_df[ALL_FEATURES]
    y_val = val_df["label"].values

    x_test = test_df[ALL_FEATURES]
    y_test = test_df["label"].values

    candidate_models = {
        "DecisionTree": DecisionTreeClassifier(max_depth=8, random_state=42),
        "HistGradientBoosting": HistGradientBoostingClassifier(random_state=42, max_iter=80),
        "LightGBM": LGBMClassifier(
            n_estimators=100,
            learning_rate=0.05,
            num_leaves=31,
            random_state=42,
            verbose=-1,
        ),
    }

    comparison_results: dict[str, Any] = {}
    fitted_pipelines: dict[str, Pipeline] = {}

    for name, estimator in candidate_models.items():
        logger.info(f"Training candidate model: {name}...")
        pipeline = Pipeline(
            steps=[
                ("preprocessor", build_preprocessing_pipeline()),
                ("classifier", estimator),
            ]
        )

        pipeline.fit(x_train, y_train)
        fitted_pipelines[name] = pipeline

        # Predict probabilities on validation split
        val_proba = pipeline.predict_proba(x_val)[:, 1]
        default_metrics = compute_classification_metrics(y_val, val_proba, threshold=0.50)
        calibrated_thresh = calibrate_threshold(y_val, val_proba, max_acceptable_fpr=0.05)
        calibrated_metrics = compute_classification_metrics(
            y_val, val_proba, threshold=calibrated_thresh
        )
        per_class_rec = compute_per_attack_recall(val_df, val_proba, threshold=calibrated_thresh)

        comparison_results[name] = {
            "val_metrics_default_0_50": default_metrics,
            "calibrated_threshold": calibrated_thresh,
            "val_metrics_calibrated": calibrated_metrics,
            "val_per_attack_recall": per_class_rec,
        }

        logger.info(
            f"[{name}] Val PR-AUC: {default_metrics['pr_auc']:.4f} | "
            f"F1 (theta=0.50): {default_metrics['f1']:.4f} | "
            f"F1 (calibrated theta*={calibrated_thresh}): {calibrated_metrics['f1']:.4f} | "
            f"FPR: {calibrated_metrics['fpr']:.4f}"
        )

    # Select champion based on highest validation PR-AUC and F1 score
    champion_name = max(
        comparison_results.keys(),
        key=lambda k: (
            comparison_results[k]["val_metrics_default_0_50"]["pr_auc"],
            comparison_results[k]["val_metrics_calibrated"]["f1"],
        ),
    )
    logger.info(f"Selected Champion Model for Release {target_release}: {champion_name}")

    champion_pipeline = fitted_pipelines[champion_name]
    champion_thresh = comparison_results[champion_name]["calibrated_threshold"]

    # Final unbiased evaluation on SEALED test partition (zero tuning on this data)
    test_proba = champion_pipeline.predict_proba(x_test)[:, 1]
    test_metrics = compute_classification_metrics(y_test, test_proba, threshold=champion_thresh)
    test_per_class = compute_per_attack_recall(test_df, test_proba, threshold=champion_thresh)

    logger.info(
        f"[SEALED TEST - {champion_name}] Accuracy: {test_metrics['accuracy']:.4f} | "
        f"F1: {test_metrics['f1']:.4f} | PR-AUC: {test_metrics['pr_auc']:.4f} | "
        f"ROC-AUC: {test_metrics['roc_auc']:.4f} | FPR: {test_metrics['fpr']:.4f}"
    )

    # Package Release Bundle R1
    release_dir = releases_dir / target_release
    release_dir.mkdir(parents=True, exist_ok=True)
    bundle_path = release_dir / "pipeline.joblib"
    joblib.dump(champion_pipeline, bundle_path, compress=3)
    bundle_hash = compute_sha256(bundle_path)

    release_manifest = {
        "release_id": target_release,
        "model_name": f"swayamkavach_{champion_name.lower()}_baseline",
        "model_version": f"r1-{champion_name.lower()}-v1.0.0",
        "champion_status": "CHAMPION",
        "feature_schema": "ton-conn-11-v1",
        "feature_columns": ALL_FEATURES,
        "categorical_columns": CATEGORICAL_FEATURES,
        "numerical_columns": NUMERICAL_FEATURES,
        "class_map": {"0": "normal", "1": "attack"},
        "decision_threshold": champion_thresh,
        "bundle_file": "pipeline.joblib",
        "bundle_sha256": bundle_hash,
        "split_manifest_path": str(manifest_path.relative_to(releases_dir.parent)),
        "training_rows": len(train_df),
        "estimator_class": champion_pipeline.named_steps["classifier"].__class__.__name__,
        "metrics": {
            "validation": comparison_results[champion_name]["val_metrics_calibrated"],
            "sealed_test": test_metrics,
            "sealed_test_per_attack_recall": test_per_class,
        },
        "model_comparison": comparison_results,
        "packaged_at": datetime.now(UTC).isoformat(),
    }

    manifest_output_path = release_dir / "manifest.json"
    with open(manifest_output_path, "w", encoding="utf-8") as f:
        json.dump(release_manifest, f, indent=2)

    logger.info(f"Release {target_release} bundle successfully packaged at {release_dir}")
    return release_manifest


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="SwayamKavach IDS Pipeline Trainer")
    parser.add_argument("--release-id", default="R1", help="Target release identifier (e.g. R1, R2-candidate)")
    parser.add_argument("--model", default=None, help="Specific model to train or evaluate")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    repo_backend = Path(__file__).resolve().parent.parent.parent.parent
    proc_dir = repo_backend / "data" / "processed"
    rel_dir = repo_backend / "releases"
    split_man = repo_backend / "manifests" / "splits" / "split_manifest_v1.json"

    manifest = train_and_evaluate(
        data_dir=proc_dir,
        releases_dir=rel_dir,
        manifest_path=split_man,
        target_release=args.release_id,
    )


    print("\n================== Release R1 Baseline Package Summary ==================")
    print(f"Release ID:         {manifest['release_id']}")
    print(f"Champion Model:     {manifest['model_name']} ({manifest['estimator_class']})")
    print(f"Decision Threshold: {manifest['decision_threshold']}")
    print(f"Val PR-AUC:         {manifest['metrics']['validation']['pr_auc']:.4f}")
    print(f"Test Accuracy:      {manifest['metrics']['sealed_test']['accuracy']:.4f}")
    print(f"Test Recall:        {manifest['metrics']['sealed_test']['recall']:.4f}")
    print(f"Test FPR:           {manifest['metrics']['sealed_test']['fpr']:.4f}")
    print(f"Test F1:            {manifest['metrics']['sealed_test']['f1']:.4f}")
    print(f"Test ROC-AUC:       {manifest['metrics']['sealed_test']['roc_auc']:.4f}")
    print("Test Per-Attack-Class Recall:")
    for attack, rec in manifest["metrics"]["sealed_test_per_attack_recall"].items():
        print(f"  - {attack:12s}: {rec*100:.2f}%")
    print("==========================================================================")
