"""Level A2 Localized Targeted Subspace Adaptation.

Implements Phase 6 Level A2 remediation:
  - Takes local monitoring window features and ground-truth labels.
  - Adapts local decision boundaries to address localized covariate and cluster shift.
  - Performs validation on the adapted slice.
  - Packages candidate model release artifact with provenance manifest.
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.metrics import f1_score, precision_score, recall_score

logger = logging.getLogger("swayamkavach.dari.adapter")


@dataclass(frozen=True)
class AdaptationResult:
    """Outcome of Level A2 localized adaptation."""

    candidate_release_id: str
    artifact_dir: str
    adaptation_duration_seconds: float
    status: str
    manifest: dict[str, Any]
    candidate_pipeline: Any | None = None
    bundle_path: Path | None = None
    manifest_path: Path | None = None
    training_samples: int = 0
    error_message: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "candidate_release_id": self.candidate_release_id,
            "artifact_dir": self.artifact_dir,
            "adaptation_duration_seconds": self.adaptation_duration_seconds,
            "status": self.status,
            "manifest": self.manifest,
            "training_samples": self.training_samples,
            "error_message": self.error_message,
        }


def compute_sha256(file_path: Path) -> str:
    """Compute SHA-256 digest of a file."""
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(1024 * 1024):
            sha.update(chunk)
    return sha.hexdigest()


class LocalSubspaceAdapter:
    """Performs localized/targeted model adaptation on drift windows."""

    def __init__(
        self,
        backend_dir: Path | None = None,
        releases_dir: Path | None = None,
        min_samples: int = 50,
    ):
        self.backend_dir = backend_dir or Path(__file__).resolve().parent.parent.parent.parent
        self.releases_dir = releases_dir or (self.backend_dir / "releases")
        self.min_samples = min_samples

    def adapt(
        self,
        base_pipeline: Any | None = None,
        window_df: pd.DataFrame | None = None,
        candidate_release_id: str | None = None,
        champion_release_id: str = "R1",
    ) -> AdaptationResult:
        """Convenience method matching EmpiricalBenchmarkRunner and test signatures."""
        if window_df is None:
            raise ValueError("window_df is required")
        y = window_df["label"].values if "label" in window_df.columns else None
        cid = candidate_release_id or f"R2-adapt-{int(time.time())}"
        return self.adapt_candidate(
            features=window_df,
            y_true=y,
            candidate_release_id=cid,
            champion_release_id=champion_release_id,
        )

    def adapt_candidate(
        self,
        features: list[dict[str, Any]] | pd.DataFrame,
        y_true: list[int | None] | np.ndarray,
        candidate_release_id: str = "R2-adapted",
        champion_release_id: str = "R1",
    ) -> AdaptationResult:
        """Fit targeted adaptation on localized drift window and produce candidate bundle."""
        start_time = time.time()
        output_dir = self.releases_dir / candidate_release_id
        output_dir.mkdir(parents=True, exist_ok=True)

        champ_dir = self.releases_dir / champion_release_id
        champ_bundle = champ_dir / "pipeline.joblib"
        if not champ_bundle.exists():
            champ_bundle = self.backend_dir / "releases" / champion_release_id / "pipeline.joblib"

        if not champ_bundle.exists():
            duration = round(time.time() - start_time, 2)
            msg = f"Champion bundle {champ_bundle} not found for A2 adaptation"
            logger.error(msg)
            return AdaptationResult(
                candidate_release_id=candidate_release_id,
                artifact_dir=str(output_dir),
                adaptation_duration_seconds=duration,
                status="failed",
                manifest={},
                error_message=msg,
            )

        # Convert features to DataFrame if needed
        df = pd.DataFrame(features) if isinstance(features, list) else features.copy()
        y_arr = np.asarray(y_true)

        # Filter valid labeled samples
        valid_mask = [y is not None and not pd.isna(y) for y in y_arr]
        if sum(valid_mask) < self.min_samples:
            duration = round(time.time() - start_time, 2)
            msg = f"Insufficient labeled samples for A2 adaptation: {sum(valid_mask)} < {self.min_samples}"
            logger.warning(msg)
            return AdaptationResult(
                candidate_release_id=candidate_release_id,
                artifact_dir=str(output_dir),
                adaptation_duration_seconds=duration,
                status="insufficient_data",
                manifest={},
                error_message=msg,
            )

        df_labeled = df.iloc[valid_mask].reset_index(drop=True)
        y_labeled = np.array([int(y_arr[i]) for i, v in enumerate(valid_mask) if v])

        # Verify both attack and normal classes are represented
        if len(set(y_labeled)) < 2:
            duration = round(time.time() - start_time, 2)
            msg = "Single-class labeled data in window; localized adaptation requires both normal and attack samples"
            logger.warning(msg)
            return AdaptationResult(
                candidate_release_id=candidate_release_id,
                artifact_dir=str(output_dir),
                adaptation_duration_seconds=duration,
                status="single_class_data",
                manifest={},
                error_message=msg,
            )

        try:
            # Load champion pipeline
            champ_pipeline = joblib.load(champ_bundle)

            # Clone champion pipeline architecture
            adapted_pipeline = clone(champ_pipeline)

            # Load a small baseline anchor sample from val.csv.gz to prevent catastrophic forgetting
            val_path = self.backend_dir / "data" / "processed" / "val.csv.gz"
            if val_path.exists():
                val_df = pd.read_csv(val_path, nrows=300)
                anchor_cols = [c for c in df_labeled.columns if c in val_df.columns]
                x_anchor = val_df[anchor_cols]
                y_anchor = val_df["label"].values
                x_combined = pd.concat([df_labeled[anchor_cols], x_anchor], ignore_index=True)
                y_combined = np.concatenate([y_labeled, y_anchor])
            else:
                anchor_cols = list(df_labeled.columns)
                x_combined = df_labeled
                y_combined = y_labeled

            # Fit adapted pipeline on localized window + anchor
            adapted_pipeline.fit(x_combined, y_combined)

            # Validate on the localized window
            preds = adapted_pipeline.predict(df_labeled[anchor_cols])
            rec = float(recall_score(y_labeled, preds, zero_division=0))
            prec = float(precision_score(y_labeled, preds, zero_division=0))
            f1 = float(f1_score(y_labeled, preds, zero_division=0))

            # Save adapted pipeline bundle
            bundle_out = output_dir / "pipeline.joblib"
            joblib.dump(adapted_pipeline, bundle_out, compress=3)
            bundle_sha = compute_sha256(bundle_out)

            # Save manifest
            manifest = {
                "release_id": candidate_release_id,
                "model_name": f"swayamkavach_adapted_{candidate_release_id}",
                "model_version": f"a2-adapted-{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}",
                "repair_level": "A2",
                "adaptation_method": "local_subspace_adaptation",
                "champion_source": champion_release_id,
                "bundle_file": "pipeline.joblib",
                "bundle_sha256": bundle_sha,
                "decision_threshold": 0.42,
                "metrics": {
                    "local_window_recall": round(rec, 4),
                    "local_window_precision": round(prec, 4),
                    "local_window_f1": round(f1, 4),
                    "samples_evaluated": len(y_labeled),
                },
                "status": "ready_for_evaluation",
                "adapted_at": datetime.now(UTC).isoformat(),
            }

            manifest_path = output_dir / "manifest.json"
            with open(manifest_path, "w", encoding="utf-8") as f:
                json.dump(manifest, f, indent=2)

            duration = round(time.time() - start_time, 2)
            logger.info(
                "Level A2 localized adaptation succeeded in %.2fs: recall=%.4f, f1=%.4f -> %s",
                duration,
                rec,
                f1,
                bundle_out,
            )

            return AdaptationResult(
                candidate_release_id=candidate_release_id,
                artifact_dir=str(output_dir),
                adaptation_duration_seconds=duration,
                status="SUCCESS",
                manifest=manifest,
                candidate_pipeline=adapted_pipeline,
                bundle_path=bundle_out,
                manifest_path=manifest_path,
                training_samples=len(y_labeled),
            )

        except Exception as exc:
            duration = round(time.time() - start_time, 2)
            logger.exception("Level A2 adaptation failed: %s", exc)
            return AdaptationResult(
                candidate_release_id=candidate_release_id,
                artifact_dir=str(output_dir),
                adaptation_duration_seconds=duration,
                status="failed",
                manifest={},
                error_message=str(exc),
            )
