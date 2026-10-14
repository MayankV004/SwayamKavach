"""Dataset curation and partition splitting for SwayamKavach.

Implements Phase 1 data ingestion, schema validation, network identifier isolation,
and leakage-free stratified splitting (Train / Validation / Sealed Test / Replay).
"""

from __future__ import annotations

import hashlib
import json
import logging
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

logger = logging.getLogger("swayamkavach.training.data")

FEATURE_COLUMNS = [
    "duration",
    "src_bytes",
    "dst_bytes",
    "src_ip_bytes",
    "dst_ip_bytes",
    "src_pkts",
    "dst_pkts",
    "proto",
    "service",
    "conn_state",
    "missed_bytes",
]

IDENTIFIER_COLUMNS = [
    "src_ip",
    "src_port",
    "dst_ip",
    "dst_port",
]

LABEL_COLUMNS = [
    "label",
    "type",
]


def compute_sha256(file_path: Path) -> str:
    """Compute the SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(1024 * 1024):
            sha256.update(chunk)
    return sha256.hexdigest()


def validate_raw_dataset(raw_path: Path) -> dict[str, Any]:
    """Validate raw TON_IoT CSV against schema expectations."""
    if not raw_path.exists():
        raise FileNotFoundError(f"Raw dataset file not found: {raw_path}")

    file_hash = compute_sha256(raw_path)
    logger.info(f"Raw dataset SHA-256: {file_hash}")

    # Read first 100 rows to validate headers
    sample_df = pd.read_csv(raw_path, nrows=100)
    # Strip potential BOM from headers
    sample_df.columns = sample_df.columns.str.strip().str.lstrip("\ufeff")

    missing_features = [col for col in FEATURE_COLUMNS if col not in sample_df.columns]
    missing_identifiers = [col for col in IDENTIFIER_COLUMNS if col not in sample_df.columns]
    missing_labels = [col for col in LABEL_COLUMNS if col not in sample_df.columns]

    if missing_features or missing_identifiers or missing_labels:
        raise ValueError(
            f"Missing required columns in dataset: "
            f"features={missing_features}, identifiers={missing_identifiers}, labels={missing_labels}"
        )

    return {
        "raw_path": str(raw_path),
        "sha256": file_hash,
        "sample_columns": list(sample_df.columns),
    }


def curate_and_split(
    raw_path: Path,
    output_dir: Path,
    manifest_path: Path,
    seed: int = 42,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
) -> dict[str, Any]:
    """Load raw dataset, clean columns, isolate identifiers, and export stratified splits."""
    if not np.isclose(train_ratio + val_ratio + test_ratio, 1.0):
        raise ValueError(f"Ratios must sum to 1.0: {train_ratio=}, {val_ratio=}, {test_ratio=}")

    logger.info(f"Reading raw dataset from {raw_path}...")
    df = pd.read_csv(raw_path)

    # Strip potential BOM or whitespace from column headers
    df.columns = df.columns.str.strip().str.lstrip("\ufeff")

    # Generate deterministic flow event IDs for lineage tracking
    df["event_id"] = [f"ton-{idx:06d}" for idx in range(len(df))]

    # Ensure clean types and strip whitespace on categoricals
    for cat_col in ["proto", "service", "conn_state", "type"]:
        df[cat_col] = df[cat_col].astype(str).str.strip()

    # Enforce non-negative constraints on numeric features
    for num_col in [
        "duration",
        "src_bytes",
        "dst_bytes",
        "src_ip_bytes",
        "dst_ip_bytes",
        "src_pkts",
        "dst_pkts",
        "missed_bytes",
    ]:
        df[num_col] = pd.to_numeric(df[num_col], errors="coerce").fillna(0.0)
        df[num_col] = df[num_col].clip(lower=0.0)

    # Ensure binary label is 0 or 1
    df["label"] = df["label"].astype(int)

    total_rows = len(df)
    logger.info(f"Loaded {total_rows} total rows across {df['type'].nunique()} classes.")

    # First split: Train (70%) vs Rest (30%)
    train_df, rest_df = train_test_split(
        df,
        train_size=train_ratio,
        random_state=seed,
        stratify=df["type"],
    )

    # Second split: Validation (15% total -> 50% of rest) vs Sealed Test (15% total -> 50% of rest)
    val_share_of_rest = val_ratio / (val_ratio + test_ratio)
    val_df, test_df = train_test_split(
        rest_df,
        train_size=val_share_of_rest,
        random_state=seed,
        stratify=rest_df["type"],
    )

    output_dir.mkdir(parents=True, exist_ok=True)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)

    # All columns to preserve: event_id, features, identifiers, labels
    export_columns = ["event_id"] + FEATURE_COLUMNS + IDENTIFIER_COLUMNS + LABEL_COLUMNS

    train_path = output_dir / "train.csv.gz"
    val_path = output_dir / "val.csv.gz"
    test_path = output_dir / "test_sealed.csv.gz"

    train_df[export_columns].to_csv(train_path, index=False, compression="gzip")
    val_df[export_columns].to_csv(val_path, index=False, compression="gzip")
    test_df[export_columns].to_csv(test_path, index=False, compression="gzip")

    # Generate Replay slice (1,000 events) with separate delayed label stream for Phase 2 / Phase 8
    replay_df = test_df.sample(n=min(2000, len(test_df)), random_state=seed)
    replay_features_path = output_dir / "replay_features.csv.gz"
    replay_labels_path = output_dir / "replay_labels.csv.gz"

    replay_feature_cols = ["event_id"] + FEATURE_COLUMNS + IDENTIFIER_COLUMNS
    replay_label_cols = ["event_id"] + LABEL_COLUMNS

    replay_df[replay_feature_cols].to_csv(replay_features_path, index=False, compression="gzip")
    replay_df[replay_label_cols].to_csv(replay_labels_path, index=False, compression="gzip")

    manifest = {
        "manifest_version": "v1.0.0",
        "raw_source": {
            "path": str(raw_path),
            "sha256": compute_sha256(raw_path),
            "total_rows": total_rows,
        },
        "split_policy": {
            "strategy": "stratified_by_attack_type",
            "seed": seed,
            "train_ratio": train_ratio,
            "val_ratio": val_ratio,
            "test_ratio": test_ratio,
        },
        "splits": {
            "train": {
                "file": str(train_path.relative_to(output_dir.parent.parent)),
                "sha256": compute_sha256(train_path),
                "row_count": len(train_df),
                "class_distribution": train_df["label"].value_counts().to_dict(),
                "attack_type_distribution": train_df["type"].value_counts().to_dict(),
            },
            "val": {
                "file": str(val_path.relative_to(output_dir.parent.parent)),
                "sha256": compute_sha256(val_path),
                "row_count": len(val_df),
                "class_distribution": val_df["label"].value_counts().to_dict(),
                "attack_type_distribution": val_df["type"].value_counts().to_dict(),
            },
            "test_sealed": {
                "file": str(test_path.relative_to(output_dir.parent.parent)),
                "sha256": compute_sha256(test_path),
                "row_count": len(test_df),
                "class_distribution": test_df["label"].value_counts().to_dict(),
                "attack_type_distribution": test_df["type"].value_counts().to_dict(),
            },
            "replay_stream": {
                "features_file": str(replay_features_path.relative_to(output_dir.parent.parent)),
                "labels_file": str(replay_labels_path.relative_to(output_dir.parent.parent)),
                "row_count": len(replay_df),
                "class_distribution": replay_df["label"].value_counts().to_dict(),
                "attack_type_distribution": replay_df["type"].value_counts().to_dict(),
            },
        },
        "feature_schema": "ton-conn-11-v1",
        "feature_columns": FEATURE_COLUMNS,
        "identifier_columns": IDENTIFIER_COLUMNS,
        "label_columns": LABEL_COLUMNS,
    }

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    logger.info(f"Split manifest generated at {manifest_path}")
    return manifest


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    repo_backend = Path(__file__).resolve().parent.parent.parent.parent
    raw_csv = repo_backend / "data" / "raw" / "train_test_network.csv"
    processed_dir = repo_backend / "data" / "processed"
    manifest_file = repo_backend / "manifests" / "splits" / "split_manifest_v1.json"

    logger.info("Executing dataset curation and partitioning...")
    validate_raw_dataset(raw_csv)
    manifest_data = curate_and_split(
        raw_path=raw_csv,
        output_dir=processed_dir,
        manifest_path=manifest_file,
    )
    print("\n=== Dataset Curation & Partitioning Completed ===")
    print(f"Train rows: {manifest_data['splits']['train']['row_count']}")
    print(f"Val rows: {manifest_data['splits']['val']['row_count']}")
    print(f"Test sealed rows: {manifest_data['splits']['test_sealed']['row_count']}")
    print(f"Replay stream rows: {manifest_data['splits']['replay_stream']['row_count']}")
    print(f"Manifest written to: {manifest_file}")
