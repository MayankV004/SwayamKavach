"""Unit tests for dataset split integrity and leakage prevention."""

import json
from pathlib import Path

import pandas as pd


def test_split_manifest_and_leakage():
    backend_dir = Path(__file__).resolve().parent.parent.parent
    manifest_path = backend_dir / "manifests" / "splits" / "split_manifest_v1.json"
    
    assert manifest_path.exists(), f"Split manifest does not exist at {manifest_path}"
    
    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)
        
    assert manifest["manifest_version"] == "v1.0.0"
    assert manifest["feature_schema"] == "ton-conn-11-v1"
    
    # Check that split files exist
    splits = manifest["splits"]
    train_path = backend_dir / splits["train"]["file"]
    val_path = backend_dir / splits["val"]["file"]
    test_path = backend_dir / splits["test_sealed"]["file"]
    
    assert train_path.exists()
    assert val_path.exists()
    assert test_path.exists()
    
    # Load event IDs to verify zero overlap (strict leakage check)
    train_ids = set(pd.read_csv(train_path, usecols=["event_id"])["event_id"])
    val_ids = set(pd.read_csv(val_path, usecols=["event_id"])["event_id"])
    test_ids = set(pd.read_csv(test_path, usecols=["event_id"])["event_id"])
    
    assert len(train_ids.intersection(val_ids)) == 0, "Data leakage detected: train and val share event IDs!"
    assert len(train_ids.intersection(test_ids)) == 0, "Data leakage detected: train and test share event IDs!"
    assert len(val_ids.intersection(test_ids)) == 0, "Data leakage detected: val and test share event IDs!"
    
    assert len(train_ids) == splits["train"]["row_count"]
    assert len(val_ids) == splits["val"]["row_count"]
    assert len(test_ids) == splits["test_sealed"]["row_count"]


def test_replay_stream_delayed_label_separation():
    backend_dir = Path(__file__).resolve().parent.parent.parent
    features_path = backend_dir / "data" / "processed" / "replay_features.csv.gz"
    labels_path = backend_dir / "data" / "processed" / "replay_labels.csv.gz"
    
    assert features_path.exists()
    assert labels_path.exists()
    
    feat_df = pd.read_csv(features_path)
    label_df = pd.read_csv(labels_path)
    
    # Features file must NOT contain label or type
    assert "label" not in feat_df.columns, "Target label leaked into inference feature stream!"
    assert "type" not in feat_df.columns, "Attack type leaked into inference feature stream!"
    
    # Labels file must contain event_id, label, and type
    assert "event_id" in label_df.columns
    assert "label" in label_df.columns
    assert "type" in label_df.columns
    
    # Event IDs must match 1:1
    assert list(feat_df["event_id"]) == list(label_df["event_id"])
