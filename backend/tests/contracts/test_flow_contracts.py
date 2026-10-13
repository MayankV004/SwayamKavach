"""Contract tests verifying data schemas and boundaries."""

from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from schemas.flow_event import FlowEvent, NetworkIdentifiers, TONConnectionFeatures
from schemas.ingestion import BatchIngestRequest
from schemas.lifecycle import DamageFingerprint, RepairAction
from schemas.prediction import PredictionResult


def test_valid_flow_event_contract():
    """Verify standard valid FlowEvent construction."""
    feat = TONConnectionFeatures(
        duration=1.5,
        src_bytes=1024,
        dst_bytes=2048,
        src_ip_bytes=1080,
        dst_ip_bytes=2160,
        src_pkts=10,
        dst_pkts=20,
        proto="tcp",
        service="http",
        conn_state="SF",
        missed_bytes=0,
    )
    ident = NetworkIdentifiers(
        src_ip="192.168.1.10",
        dst_ip="192.168.1.1",
        src_port=44552,
        dst_port=80,
    )
    event = FlowEvent(
        event_id="evt-test-001",
        sensor_id="sensor-edge-1",
        capture_id="cap-01",
        event_time=datetime.now(UTC),
        features=feat,
        identifiers=ident,
    )

    assert event.event_id == "evt-test-001"
    assert event.features.src_bytes == 1024
    assert event.identifiers.src_ip == "192.168.1.10"


def test_forbidden_extra_feature_fields():
    """Verify that unexpected predictive features are strictly rejected."""
    with pytest.raises(ValidationError):
        TONConnectionFeatures(
            duration=1.0,
            src_bytes=100,
            dst_bytes=200,
            src_ip_bytes=150,
            dst_ip_bytes=250,
            rogue_unverified_feature="malicious_payload",  # Extra forbidden field
        )


def test_negative_feature_values_rejected():
    """Verify non-negativity constraints on flow sizes and durations."""
    with pytest.raises(ValidationError):
        TONConnectionFeatures(
            duration=-5.0,  # Negative duration invalid
            src_bytes=100,
            dst_bytes=200,
            src_ip_bytes=100,
            dst_ip_bytes=200,
        )


def test_batch_ingest_empty_events_rejected():
    """Verify that batches cannot be empty."""
    with pytest.raises(ValidationError):
        BatchIngestRequest(
            batch_id="batch-empty",
            sensor_id="sensor-1",
            events=[],  # Min length 1 constraint
        )


def test_prediction_result_score_bounds():
    """Verify prediction score must be strictly in [0.0, 1.0]."""
    with pytest.raises(ValidationError):
        PredictionResult(
            event_id="evt-1",
            score=1.5,  # Out of bounds
            prediction=1,
            prediction_purpose="production",
            release_id="R1",
            model_version="v1.0",
            slot_id="A",
            predicted_at=datetime.now(UTC),
        )


def test_dari_repair_action_ladder():
    """Verify standard preserved DARI repair action codes."""
    assert RepairAction.A0.value == "A0"
    assert RepairAction.A1.value == "A1"
    assert RepairAction.A2.value == "A2"
    assert RepairAction.A3.value == "A3"


def test_dari_damage_fingerprint():
    """Verify DARI multidimensional fingerprint constraints."""
    fp = DamageFingerprint(
        D_X=0.25,
        D_Y=0.10,
        D_B=0.45,
        Q=0.98,
        L=0.90,
        S=1500,
        R=2,
    )
    assert fp.D_X == 0.25
    assert fp.S == 1500

    # Bounds check
    with pytest.raises(ValidationError):
        DamageFingerprint(
            D_X=1.5,  # Must be <= 1.0
            D_Y=0.0,
            D_B=0.0,
            Q=1.0,
            L=1.0,
            S=100,
        )
