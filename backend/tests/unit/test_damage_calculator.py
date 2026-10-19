"""Unit tests for DARI 7D Damage Calculator, Window Selector, and Label Ingestion."""

from datetime import UTC, datetime

import numpy as np
import pandas as pd
from starlette.testclient import TestClient

from schemas.label import DelayedLabelBatch, DelayedLabelItem
from swayamkavach.api.main import app
from swayamkavach.damage.calculator import DamageCalculator
from swayamkavach.db.models import FlowEventRecordDB, IngestionBatchRecordDB, PredictionRecordDB
from swayamkavach.db.session import SessionLocal, init_db
from swayamkavach.monitoring.window import WindowSelector


def test_damage_calculator_nominal_traffic():
    """Verify that identical distribution and high-confidence predictions yield low D_X and D_B."""
    # Synthetic normal data
    n_samples = 200
    df_ref = pd.DataFrame({
        "duration": np.random.exponential(1.0, n_samples),
        "src_bytes": np.random.gamma(2.0, 100.0, n_samples),
        "dst_bytes": np.random.gamma(2.0, 200.0, n_samples),
        "src_ip_bytes": np.random.gamma(2.0, 150.0, n_samples),
        "dst_ip_bytes": np.random.gamma(2.0, 250.0, n_samples),
        "src_pkts": np.random.poisson(5, n_samples),
        "dst_pkts": np.random.poisson(8, n_samples),
        "missed_bytes": np.zeros(n_samples),
    })

    # Nominal current df with same distribution
    df_curr = pd.DataFrame({
        "duration": np.random.exponential(1.0, n_samples),
        "src_bytes": np.random.gamma(2.0, 100.0, n_samples),
        "dst_bytes": np.random.gamma(2.0, 200.0, n_samples),
        "src_ip_bytes": np.random.gamma(2.0, 150.0, n_samples),
        "dst_ip_bytes": np.random.gamma(2.0, 250.0, n_samples),
        "src_pkts": np.random.poisson(5, n_samples),
        "dst_pkts": np.random.poisson(8, n_samples),
        "missed_bytes": np.zeros(n_samples),
    })

    # High-confidence decisive scores (0.01 and 0.99)
    scores = np.concatenate([np.full(100, 0.01), np.full(100, 0.99)])
    y_true = np.concatenate([np.zeros(100, dtype=int), np.ones(100, dtype=int)])

    calc = DamageCalculator(reference_df=df_ref, decision_threshold=0.42)
    fp = calc.compute_fingerprint(
        current_df=df_curr,
        scores=scores,
        y_true=y_true,
    )

    assert fp.D_X < 0.25, f"Expected low distribution drift, got {fp.D_X}"
    assert fp.D_B < 0.20, f"Expected low boundary damage, got {fp.D_B}"
    assert fp.D_Y is not None and fp.D_Y < 0.05, f"Expected low performance degradation, got {fp.D_Y}"
    assert fp.Q >= 0.95, f"Expected high data quality, got {fp.Q}"
    assert fp.S == n_samples


def test_damage_calculator_covariate_drift():
    """Verify that substantial distribution shifts trigger high D_X."""
    n_samples = 200
    df_ref = pd.DataFrame({
        "duration": np.random.exponential(1.0, n_samples),
        "src_bytes": np.random.gamma(2.0, 50.0, n_samples),
        "dst_bytes": np.random.gamma(2.0, 50.0, n_samples),
        "src_ip_bytes": np.random.gamma(2.0, 50.0, n_samples),
        "dst_ip_bytes": np.random.gamma(2.0, 50.0, n_samples),
        "src_pkts": np.random.poisson(5, n_samples),
        "dst_pkts": np.random.poisson(5, n_samples),
        "missed_bytes": np.zeros(n_samples),
    })

    # Heavily shifted distribution (e.g. volumetric flood or attack shift)
    df_shifted = pd.DataFrame({
        "duration": np.random.exponential(100.0, n_samples),
        "src_bytes": np.random.gamma(50.0, 1000.0, n_samples),
        "dst_bytes": np.random.gamma(50.0, 2000.0, n_samples),
        "src_ip_bytes": np.random.gamma(50.0, 1500.0, n_samples),
        "dst_ip_bytes": np.random.gamma(50.0, 2500.0, n_samples),
        "src_pkts": np.random.poisson(500, n_samples),
        "dst_pkts": np.random.poisson(800, n_samples),
        "missed_bytes": np.full(n_samples, 50),
    })

    calc = DamageCalculator(reference_df=df_ref)
    d_x = calc.compute_distribution_drift(df_shifted)

    assert d_x > 0.50, f"Expected severe covariate drift (D_X > 0.5), got {d_x}"


def test_damage_calculator_boundary_ambiguity():
    """Verify that predictions clustering within margin band around theta trigger high D_B."""
    n_samples = 200
    # Center all predictions right around decision threshold theta = 0.42 +- 0.03
    scores = np.random.uniform(0.39, 0.45, n_samples)

    calc = DamageCalculator(decision_threshold=0.42, margin_band=0.10)
    d_b = calc.compute_boundary_damage(scores)

    # All predictions fall in ambiguity band and entropy is near maximal
    assert d_b > 0.80, f"Expected high boundary ambiguity (D_B > 0.80), got {d_b}"


def test_damage_calculator_unlabelled_window_invariant():
    """DARI invariant: Unlabelled evaluation windows MUST return D_Y = None, never 0.0 or assumed healthy."""
    n_samples = 100
    df = pd.DataFrame({
        "duration": np.random.exponential(1.0, n_samples),
        "src_bytes": np.random.uniform(10, 100, n_samples),
    })
    scores = np.random.uniform(0.1, 0.9, n_samples)

    calc = DamageCalculator()
    fp = calc.compute_fingerprint(
        current_df=df,
        scores=scores,
        y_true=None,  # Unlabelled stream
    )

    assert fp.D_Y is None, "DARI invariant breach: D_Y must be None when labels are absent."
    assert fp.L == 0.0, "Label reliability must be 0.0 when unlabelled."


def test_delayed_label_ingestion_api():
    """Verify delayed label ingestion API (POST /api/v1/labels) and idempotency."""
    init_db()
    client = TestClient(app, headers={"X-API-Key": "swayamkavach-control-plane-secret-key-v1"})
    import uuid

    uid = uuid.uuid4().hex[:6]
    ev1 = f"test_ev_lbl_{uid}_1"
    ev2 = f"test_ev_lbl_{uid}_2"

    payload = DelayedLabelBatch(
        labels=[
            DelayedLabelItem(
                event_id=ev1,
                label=1,
                attack_type="ddos",
                source="analyst_verification",
                confidence=0.98,
            ),
            DelayedLabelItem(
                event_id=ev2,
                label=0,
                attack_type=None,
                source="firewall_log",
                confidence=0.95,
            ),
        ]
    )

    response = client.post("/api/v1/labels", json=payload.model_dump(mode="json"))
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "accepted"
    assert data["ingested_count"] == 2
    assert data["updated_count"] == 0

    # Test idempotency / update
    update_payload = DelayedLabelBatch(
        labels=[
            DelayedLabelItem(
                event_id=ev1,
                label=1,
                attack_type="ddos",
                source="threat_intel_feed",
                confidence=1.0,
            ),
        ]
    )
    update_resp = client.post("/api/v1/labels", json=update_payload.model_dump(mode="json"))
    assert update_resp.status_code == 201
    update_data = update_resp.json()
    assert update_data["ingested_count"] == 0
    assert update_data["updated_count"] == 1


def test_monitoring_window_selector_flow():
    """Verify WindowSelector aggregates flow events, predictions, and delayed labels into MonitoringWindow."""
    init_db()
    db = SessionLocal()
    import uuid

    now = datetime.now(UTC)
    uid = uuid.uuid4().hex[:6]
    batch_id = f"test_window_batch_{uid}"

    # Add batch header
    batch = IngestionBatchRecordDB(
        batch_id=batch_id,
        sensor_id="sensor_test",
        schema_version="ton-conn-v1",
        extractor_id="zeek",
        event_count=3,
        status="accepted",
        received_at=now,
    )
    db.merge(batch)

    # Add 3 flow events marked as predicted
    for i in range(1, 4):
        ev_id = f"test_window_{uid}_ev_{i:03d}"
        ev = FlowEventRecordDB(
            event_id=ev_id,
            batch_id=batch_id,
            sensor_id="sensor_test",
            event_time=now,
            features={"duration": float(i), "src_bytes": i * 100, "dst_bytes": i * 200},
            is_predicted=True,
            created_at=now,
        )
        db.merge(ev)

        # Add corresponding prediction
        pred = PredictionRecordDB(
            event_id=ev_id,
            prediction_purpose="production",
            score=0.1 * i,
            prediction=0,
            release_id="R1",
            model_version="1.0",
            slot_id="A",
            predicted_at=now,
        )
        db.add(pred)

    db.commit()

    # Now ingest label for event 1
    client = TestClient(app, headers={"X-API-Key": "swayamkavach-control-plane-secret-key-v1"})
    ev_first = f"test_window_{uid}_ev_001"
    client.post(
        "/api/v1/labels",
        json={
            "labels": [
                {
                    "event_id": ev_first,
                    "label": 0,
                    "confidence": 0.99,
                }
            ]
        },
    )


    selector = WindowSelector(window_size=10)
    window = selector.select_latest_window(db)

    assert window is not None
    assert window.sample_count >= 3
    assert len(window.features_df) >= 3
    assert len(window.scores) >= 3
    assert window.label_coverage > 0.0
    assert window.y_true is not None and len(window.y_true) >= 1

    db.close()
