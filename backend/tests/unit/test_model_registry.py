"""Unit tests for Phase 3: DVC Tracking & MLflow Model Registry Lineage."""

from pathlib import Path

import numpy as np
import pandas as pd

from swayamkavach.registry import (
    REGISTERED_MODEL_NAME,
    configure_mlflow,
    load_champion_pipeline,
    log_and_register_release,
)


def test_dvc_tracking_and_config():
    """Verify that raw and processed data are tracked with valid .dvc metadata."""
    backend_dir = Path(__file__).resolve().parent.parent.parent
    raw_dvc = backend_dir / "data" / "raw" / "train_test_network.csv.dvc"
    train_dvc = backend_dir / "data" / "processed" / "train.csv.gz.dvc"
    val_dvc = backend_dir / "data" / "processed" / "val.csv.gz.dvc"
    test_dvc = backend_dir / "data" / "processed" / "test_sealed.csv.gz.dvc"
    dvc_config = backend_dir / ".dvc" / "config"

    assert raw_dvc.exists(), "Raw dataset train_test_network.csv is not tracked by DVC!"
    assert train_dvc.exists(), "Processed train.csv.gz is not tracked by DVC!"
    assert val_dvc.exists(), "Processed val.csv.gz is not tracked by DVC!"
    assert test_dvc.exists(), "Processed test_sealed.csv.gz is not tracked by DVC!"
    assert dvc_config.exists(), "DVC config file does not exist!"

    config_content = dvc_config.read_text(encoding="utf-8")
    assert "local_storage" in config_content


def test_mlflow_model_registration_and_restoration(tmp_path):
    """Verify that Release R1 can be logged, registered in MLflow, and restored cleanly."""
    backend_dir = Path(__file__).resolve().parent.parent.parent
    release_dir = backend_dir / "releases" / "R1"
    test_tracking_uri = f"sqlite:///{tmp_path / 'test_mlflow.db'}"

    # 1. Register release in isolated test MLflow DB
    receipt = log_and_register_release(
        release_dir=release_dir,
        experiment_name="test_swayamkavach_ids",
        tracking_uri=test_tracking_uri,
    )

    assert receipt["release_id"] == "R1"
    assert receipt["model_name"] == REGISTERED_MODEL_NAME
    assert receipt["alias"] == "champion"
    assert receipt["run_id"] is not None

    # 2. Verify registered model details via MLflowClient
    client = configure_mlflow(test_tracking_uri)
    model_version = client.get_model_version_by_alias(REGISTERED_MODEL_NAME, "champion")
    assert model_version.run_id == receipt["run_id"]
    assert model_version.tags["release_id"] == "R1"

    # 3. Clean round-trip restoration from MLflow registry
    restored_pipeline = load_champion_pipeline(
        model_name=REGISTERED_MODEL_NAME,
        tracking_uri=test_tracking_uri,
    )
    assert hasattr(restored_pipeline, "predict_proba")

    # 4. Verify score equivalence against sample features
    cat_cols = ["proto", "service", "conn_state"]
    num_cols = [
        "duration",
        "src_bytes",
        "dst_bytes",
        "src_ip_bytes",
        "dst_ip_bytes",
        "src_pkts",
        "dst_pkts",
        "missed_bytes",
    ]
    sample_df = pd.DataFrame(
        [
            {
                "duration": 0.0,
                "src_bytes": 0,
                "dst_bytes": 0,
                "src_ip_bytes": 62,
                "dst_ip_bytes": 0,
                "src_pkts": 1,
                "dst_pkts": 0,
                "proto": "udp",
                "service": "dns",
                "conn_state": "S0",
                "missed_bytes": 0,
            }
        ]
    )[num_cols + cat_cols]

    score = restored_pipeline.predict_proba(sample_df)[:, 1][0]
    assert isinstance(score, (float, np.floating))
    assert score < 0.42  # Benign DNS flow score bound
