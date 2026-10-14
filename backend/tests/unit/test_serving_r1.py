"""Unit tests for Serving Slot A loading and scoring with Release R1 bundle."""

from datetime import UTC, datetime

from fastapi.testclient import TestClient

from schemas.flow_event import FlowEvent, TONConnectionFeatures
from schemas.prediction import PredictionRequest
from swayamkavach.serving.app import app

client = TestClient(app)


def test_serving_slot_identity_and_readyz():
    """Verify that serving slot loads R1 manifest and reports readiness."""
    resp = client.get("/readyz")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ready"
    assert data["release_id"] == "R1"
    assert data["threshold"] == 0.42

    resp_id = client.get("/identity")
    assert resp_id.status_code == 200
    id_data = resp_id.json()
    assert id_data["release_id"] == "R1"
    assert id_data["is_bundled_model"] is True
    assert "histgradientboosting" in id_data["model_version"].lower()


def test_serving_predict_with_real_r1_pipeline():
    """Verify scoring a benign flow vs attack flow using real R1 pipeline."""
    # Canonical normal DNS query flow (verified benign signature)
    normal_flow = FlowEvent(
        event_id="flow-normal-001",
        sensor_id="sensor-01",
        event_time=datetime.now(UTC),
        features=TONConnectionFeatures(
            duration=0.0,
            src_bytes=0,
            dst_bytes=0,
            src_ip_bytes=62,
            dst_ip_bytes=0,
            src_pkts=1,
            dst_pkts=0,
            proto="udp",
            service="dns",
            conn_state="S0",
            missed_bytes=0,
        ),
    )

    # Typical anomalous / heavy attack flow
    attack_flow = FlowEvent(
        event_id="flow-attack-001",
        sensor_id="sensor-01",
        event_time=datetime.now(UTC),
        features=TONConnectionFeatures(
            duration=290.0,
            src_bytes=101568,
            dst_bytes=2592,
            src_ip_bytes=108064,
            dst_ip_bytes=3832,
            src_pkts=108,
            dst_pkts=31,
            proto="tcp",
            service="-",
            conn_state="OTH",
            missed_bytes=0,
        ),
    )

    req = PredictionRequest(events=[normal_flow, attack_flow], prediction_purpose="production")
    resp = client.post("/predict", json=req.model_dump(mode="json"))

    assert resp.status_code == 200
    data = resp.json()
    assert data["release_id"] == "R1"
    assert len(data["predictions"]) == 2

    pred_normal = data["predictions"][0]
    pred_attack = data["predictions"][1]

    assert pred_normal["event_id"] == "flow-normal-001"
    assert pred_normal["score"] < 0.42
    assert pred_normal["prediction"] == 0

    assert pred_attack["event_id"] == "flow-attack-001"
    assert pred_attack["score"] >= 0.42
    assert pred_attack["prediction"] == 1
