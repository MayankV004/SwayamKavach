"""Model serving slot application.

Runs as an independent service in Slot A or Slot B behind the Nginx reverse proxy.
Exposes /predict, /identity, /readyz, and /livez endpoints.
"""

import json
import logging
import os
import time
from datetime import UTC, datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, status

from schemas.prediction import PredictionRequest, PredictionResponse, PredictionResult

logger = logging.getLogger("swayamkavach.serving")

SLOT_ID = os.getenv("SLOT_ID", "A")
RELEASE_ID = os.getenv("RELEASE_ID", "R1")
MODEL_VERSION = os.getenv("MODEL_VERSION", "r1-sha-baseline-001")
DECISION_THRESHOLD = float(os.getenv("DECISION_THRESHOLD", "0.50"))

FEATURE_COLUMNS = [
    "duration",
    "src_bytes",
    "dst_bytes",
    "src_ip_bytes",
    "dst_ip_bytes",
    "src_pkts",
    "dst_pkts",
    "missed_bytes",
    "proto",
    "service",
    "conn_state",
]

# Attempt to load packaged model bundle for RELEASE_ID
backend_dir = Path(__file__).resolve().parent.parent.parent.parent
release_dir = backend_dir / "releases" / RELEASE_ID
manifest_file = release_dir / "manifest.json"
bundle_file = release_dir / "pipeline.joblib"

_pipeline = None
_is_ready = False

try:
    if manifest_file.exists():
        with open(manifest_file, encoding="utf-8") as f:
            manifest_data = json.load(f)
            MODEL_VERSION = manifest_data.get("model_version", MODEL_VERSION)
            DECISION_THRESHOLD = float(manifest_data.get("decision_threshold", DECISION_THRESHOLD))

    if bundle_file.exists():
        _pipeline = joblib.load(bundle_file)
        logger.info(f"Loaded release {RELEASE_ID} pipeline from {bundle_file}")
    else:
        logger.warning(f"No release bundle found at {bundle_file}; serving in heuristic fallback mode.")
    _is_ready = True
except Exception as e:
    logger.error(f"Failed to load release {RELEASE_ID} model bundle: {e}")
    _is_ready = True  # Ready with heuristic fallback

app = FastAPI(
    title=f"SwayamKavach Serving Slot {SLOT_ID}",
    description=f"Isolated model serving runtime for release {RELEASE_ID}",
    version="0.1.0",
)


@app.get("/livez", status_code=status.HTTP_200_OK)
def livez():
    """Liveness probe."""
    return {"status": "alive", "slot": SLOT_ID}


@app.get("/readyz", status_code=status.HTTP_200_OK)
def readyz():
    """Readiness probe verifying model is warmed and ready for traffic."""
    if not _is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Model warming in progress"
        )
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
        "is_bundled_model": _pipeline is not None,
    }


def _heuristic_score(features) -> float:
    """Heuristic fallback score if no serialized model pipeline is loaded."""
    duration = float(features.duration)
    src_bytes = float(features.src_bytes)
    dst_bytes = float(features.dst_bytes)
    raw = (src_bytes / 10000.0) + (dst_bytes / 10000.0) + (duration / 60.0)
    score = float(1.0 / (1.0 + np.exp(-raw + 2.0)))
    return min(max(score, 0.0), 1.0)


@app.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
def predict(payload: PredictionRequest):
    """Score a batch of flow events using the loaded model pipeline or fallback heuristic."""
    start_time = time.perf_counter()
    results = []

    if not payload.events:
        return PredictionResponse(
            predictions=[],
            slot_id=SLOT_ID,
            release_id=RELEASE_ID,
            execution_time_ms=0.0,
        )

    if _pipeline is not None:
        # Vectorized batch prediction using loaded trained model
        feature_dicts = []
        for ev in payload.events:
            feature_dicts.append(ev.features.model_dump())
        feat_df = pd.DataFrame(feature_dicts)[FEATURE_COLUMNS]
        scores = _pipeline.predict_proba(feat_df)[:, 1]
    else:
        scores = [_heuristic_score(ev.features) for ev in payload.events]

    for ev, score in zip(payload.events, scores, strict=False):
        score_val = float(round(float(score), 4))
        pred_class = 1 if score_val >= DECISION_THRESHOLD else 0
        results.append(
            PredictionResult(
                event_id=ev.event_id,
                score=score_val,
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

