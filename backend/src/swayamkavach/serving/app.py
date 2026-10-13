"""Model serving slot application.

Runs as an independent service in Slot A or Slot B behind the Nginx reverse proxy.
Exposes /predict, /identity, /readyz, and /livez endpoints.
"""

import os
import time
from datetime import UTC, datetime

import numpy as np
from fastapi import FastAPI, HTTPException, status

from schemas.prediction import PredictionRequest, PredictionResponse, PredictionResult

SLOT_ID = os.getenv("SLOT_ID", "A")
RELEASE_ID = os.getenv("RELEASE_ID", "R1")
MODEL_VERSION = os.getenv("MODEL_VERSION", "r1-sha-baseline-001")
DECISION_THRESHOLD = float(os.getenv("DECISION_THRESHOLD", "0.50"))

app = FastAPI(
    title=f"SwayamKavach Serving Slot {SLOT_ID}",
    description=f"Isolated model serving runtime for release {RELEASE_ID}",
    version="0.1.0",
)

_is_ready = True  # Model warm-up flag


@app.get("/livez", status_code=status.HTTP_200_OK)
def livez():
    """Liveness probe."""
    return {"status": "alive", "slot": SLOT_ID}


@app.get("/readyz", status_code=status.HTTP_200_OK)
def readyz():
    """Readiness probe verifying model is warmed and ready for traffic."""
    if not _is_ready:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Model warming in progress")
    return {
        "status": "ready",
        "slot": SLOT_ID,
        "release_id": RELEASE_ID,
        "threshold": DECISION_THRESHOLD,
    }


@app.get("/identity", status_code=status.HTTP_200_OK)
def identity():
    """Returns actual release and slot identity for auditing."""
    return {
        "slot_id": SLOT_ID,
        "release_id": RELEASE_ID,
        "model_version": MODEL_VERSION,
        "decision_threshold": DECISION_THRESHOLD,
    }


def _score_event(features) -> float:
    """Baseline heuristic score function for testing before custom model bundle is loaded.

    Replaced when R1 scikit-learn/LightGBM model artifact is deserialized.
    Flags high-volume, anomalous byte flows as potential attacks.
    """
    # Simple deterministic heuristic: high duration or extreme packet/byte counts
    duration = float(features.duration)
    src_bytes = float(features.src_bytes)
    dst_bytes = float(features.dst_bytes)

    # Normalized synthetic anomaly metric
    raw = (src_bytes / 10000.0) + (dst_bytes / 10000.0) + (duration / 60.0)
    score = float(1.0 / (1.0 + np.exp(-raw + 2.0)))  # Sigmoid scaled
    return min(max(score, 0.0), 1.0)


@app.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
def predict(payload: PredictionRequest):
    """Score a batch of flow events."""
    start_time = time.perf_counter()
    results = []

    for event in payload.events:
        score = _score_event(event.features)
        pred_class = 1 if score >= DECISION_THRESHOLD else 0

        results.append(
            PredictionResult(
                event_id=event.event_id,
                score=round(score, 4),
                prediction=pred_class,
                prediction_purpose=payload.prediction_purpose,
                release_id=RELEASE_ID,
                model_version=MODEL_VERSION,
                slot_id=SLOT_ID,
                predicted_at=datetime.now(UTC),
            )
        )

    duration_ms = (time.perf_counter() - start_time) * 1000.0

    return PredictionResponse(
        predictions=results,
        slot_id=SLOT_ID,
        release_id=RELEASE_ID,
        execution_time_ms=round(duration_ms, 2),
    )
