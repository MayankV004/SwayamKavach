"""MLflow Model Registry & Lineage Adapter for SwayamKavach.

Implements Phase 3 immutable model versioning, experiment lineage tracking,
and champion/candidate model registration.
"""

from __future__ import annotations

import json
import logging
import os
import subprocess
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import joblib
import mlflow
from mlflow.tracking import MlflowClient

logger = logging.getLogger("swayamkavach.registry")

DEFAULT_TRACKING_URI = os.getenv(
    "MLFLOW_TRACKING_URI",
    f"sqlite:///{Path(__file__).resolve().parent.parent.parent / 'mlflow.db'}",
)
DEFAULT_EXPERIMENT_NAME = "swayamkavach_ids"
REGISTERED_MODEL_NAME = "swayamkavach_ids"


def get_git_commit_sha() -> str:
    """Retrieve current Git commit SHA safely."""
    try:
        sha = (
            subprocess.check_output(["git", "rev-parse", "HEAD"], stderr=subprocess.DEVNULL)
            .decode("utf-8")
            .strip()
        )
        return sha
    except Exception:
        return "git-sha-unknown"


def configure_mlflow(tracking_uri: str | None = None) -> MlflowClient:
    """Set the active tracking URI and return an initialized MlflowClient."""
    uri = tracking_uri or DEFAULT_TRACKING_URI
    mlflow.set_tracking_uri(uri)
    logger.info(f"Configured MLflow tracking URI: {uri}")
    return MlflowClient(tracking_uri=uri)


def log_and_register_release(
    release_dir: Path,
    experiment_name: str = DEFAULT_EXPERIMENT_NAME,
    tracking_uri: str | None = None,
    update_manifest: bool = True,
) -> dict[str, Any]:
    """Publish a validated model release bundle to MLflow and register it in the model registry."""
    client = configure_mlflow(tracking_uri)

    manifest_file = release_dir / "manifest.json"
    bundle_file = release_dir / "pipeline.joblib"

    if not manifest_file.exists():
        raise FileNotFoundError(f"Manifest not found at {manifest_file}")
    if not bundle_file.exists():
        raise FileNotFoundError(f"Model pipeline bundle not found at {bundle_file}")

    with open(manifest_file, encoding="utf-8") as f:
        manifest = json.load(f)

    release_id = manifest.get("release_id", "R1")
    model_version_tag = manifest.get("model_version", f"{release_id}-v1.0.0")
    estimator_class = manifest.get("estimator_class", "Classifier")
    decision_thresh = float(manifest.get("decision_threshold", 0.50))
    git_sha = get_git_commit_sha()

    # Ensure experiment exists
    exp = client.get_experiment_by_name(experiment_name)
    if exp is None:
        exp_id = client.create_experiment(experiment_name)
    else:
        exp_id = exp.experiment_id

    run_name = f"release_{release_id}_{model_version_tag}"
    with mlflow.start_run(experiment_id=exp_id, run_name=run_name) as run:
        run_id = run.info.run_id
        logger.info(f"Started MLflow run {run_id} for release {release_id}")

        # 1. Log Run Parameters
        mlflow.log_params(
            {
                "release_id": release_id,
                "model_version": model_version_tag,
                "estimator_class": estimator_class,
                "decision_threshold": decision_thresh,
                "feature_schema": manifest.get("feature_schema", "ton-conn-11-v1"),
                "training_rows": manifest.get("training_rows", 0),
                "split_manifest_path": manifest.get("split_manifest_path", ""),
            }
        )

        # 2. Log Metrics (Validation & Sealed Test)
        val_metrics = manifest.get("metrics", {}).get("validation", {})
        for metric_name, metric_val in val_metrics.items():
            if isinstance(metric_val, (int, float)):
                mlflow.log_metric(f"val_{metric_name}", float(metric_val))

        test_metrics = manifest.get("metrics", {}).get("sealed_test", {})
        for metric_name, metric_val in test_metrics.items():
            if isinstance(metric_val, (int, float)):
                mlflow.log_metric(f"test_{metric_name}", float(metric_val))

        # Log per-attack-class recall metrics
        per_attack = manifest.get("metrics", {}).get("sealed_test_per_attack_recall", {})
        for attack_name, recall_val in per_attack.items():
            mlflow.log_metric(f"test_recall_{attack_name}", float(recall_val))

        # 3. Log Tags
        mlflow.set_tags(
            {
                "release_id": release_id,
                "champion_status": manifest.get("champion_status", "CHAMPION"),
                "git_commit_sha": git_sha,
                "bundle_sha256": manifest.get("bundle_sha256", ""),
                "registered_at": datetime.now(UTC).isoformat(),
            }
        )

        # 4. Log Artifacts
        mlflow.log_artifact(str(manifest_file), artifact_path="release_metadata")
        mlflow.log_artifact(str(bundle_file), artifact_path="model_bundle")

        # 5. Register Model in Model Registry
        try:
            client.create_registered_model(REGISTERED_MODEL_NAME)
        except Exception:
            pass  # Already exists

        artifact_uri = f"runs:/{run_id}/model_bundle"
        model_version_obj = client.create_model_version(
            name=REGISTERED_MODEL_NAME,
            source=artifact_uri,
            run_id=run_id,
            tags={"release_id": release_id, "git_sha": git_sha},
            description=f"SwayamKavach Release {release_id} baseline model ({estimator_class})",
        )

        # Assign alias 'champion' if designated champion
        if manifest.get("champion_status") == "CHAMPION":
            try:
                client.set_registered_model_alias(
                    name=REGISTERED_MODEL_NAME,
                    alias="champion",
                    version=model_version_obj.version,
                )
            except Exception as e:
                logger.warning(f"Could not set alias champion: {e}")

        # Update manifest.json with MLflow provenance
        manifest["mlflow"] = {
            "tracking_uri": mlflow.get_tracking_uri(),
            "experiment_id": exp_id,
            "run_id": run_id,
            "registered_model_name": REGISTERED_MODEL_NAME,
            "registered_model_version": model_version_obj.version,
            "git_commit_sha": git_sha,
        }

        if update_manifest:
            with open(manifest_file, "w", encoding="utf-8") as f:
                json.dump(manifest, f, indent=2)

        logger.info(
            f"Release {release_id} registered in MLflow: Model='{REGISTERED_MODEL_NAME}', "
            f"Version={model_version_obj.version}, RunID={run_id}"
        )

        return {
            "release_id": release_id,
            "run_id": run_id,
            "model_name": REGISTERED_MODEL_NAME,
            "model_version": model_version_obj.version,
            "alias": "champion",
        }


def load_champion_pipeline(
    model_name: str = REGISTERED_MODEL_NAME,
    tracking_uri: str | None = None,
) -> Any:
    """Load the champion model pipeline directly from MLflow artifact store."""
    client = configure_mlflow(tracking_uri)
    try:
        model_version = client.get_model_version_by_alias(model_name, "champion")
        run_id = model_version.run_id
    except Exception as e:
        # Fallback to latest version
        versions = client.search_model_versions(f"name='{model_name}'")
        if not versions:
            raise RuntimeError(f"No registered model versions found for '{model_name}'") from e
        run_id = versions[0].run_id

    local_path = client.download_artifacts(run_id, "model_bundle/pipeline.joblib")
    return joblib.load(local_path)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    backend_path = Path(__file__).resolve().parent.parent.parent
    rel_r1_dir = backend_path / "releases" / "R1"

    receipt = log_and_register_release(rel_r1_dir)
    print("\n=== Model Registration Receipt ===")
    print(f"Registered Model:   {receipt['model_name']}")
    print(f"Model Version:      {receipt['model_version']}")
    print(f"Run ID:             {receipt['run_id']}")
    print(f"Release ID:         {receipt['release_id']}")
    print(f"Alias:              {receipt['alias']}")
    print("===================================\n")
