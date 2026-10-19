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
ALLOW_HEURISTIC_FALLBACK = os.getenv("ALLOW_HEURISTIC_FALLBACK", "false").lower() in ("true", "1", "yes")

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

backend_dir = Path(__file__).resolve().parent.parent.parent.parent
_pipeline = None
_is_ready = False


def load_model_bundle(rel_id: str, threshold: float | None = None) -> bool:
    """Load model bundle pipeline and manifest for a given release ID into memory."""
    global RELEASE_ID, MODEL_VERSION, DECISION_THRESHOLD, _pipeline, _is_ready
    rel_dir = backend_dir / "releases" / rel_id
    m_file = rel_dir / "manifest.json"
    b_file = rel_dir / "pipeline.joblib"

    if m_file.exists():
        try:
            with open(m_file, encoding="utf-8") as f:
                manifest_data = json.load(f)
                MODEL_VERSION = manifest_data.get("model_version", MODEL_VERSION)
                if threshold is None:
                    DECISION_THRESHOLD = float(manifest_data.get("decision_threshold", DECISION_THRESHOLD))
        except Exception as e:
            logger.warning(f"Error reading manifest {m_file}: {e}")

    if threshold is not None:
        DECISION_THRESHOLD = float(threshold)

    if b_file.exists():
        try:
            _pipeline = joblib.load(b_file)
            RELEASE_ID = rel_id
            _is_ready = True
            logger.info(f"Slot {SLOT_ID} successfully loaded release {rel_id} pipeline from {b_file}")
            return True
        except Exception as e:
            logger.error(f"Failed to load bundle {b_file}: {e}")
            _pipeline = None
            _is_ready = ALLOW_HEURISTIC_FALLBACK
            return False
    else:
        logger.warning(f"No release bundle found at {b_file}; model readiness failed.")
        RELEASE_ID = rel_id
        _pipeline = None
        _is_ready = ALLOW_HEURISTIC_FALLBACK
        return False


# Initial bundle load on startup (reads calibrated threshold from manifest)
load_model_bundle(RELEASE_ID)

app = FastAPI(
    title=f"SwayamKavach Serving Slot {SLOT_ID}",
    description=f"Isolated model serving runtime for release {RELEASE_ID}",
    version="0.1.0",
)


@app.post("/reload", status_code=status.HTTP_200_OK)
def reload_slot_model(release_id: str | None = None, threshold: float | None = None):
    """Hot-swap the active model bundle or calibrate decision threshold without restart."""
    target_rel = release_id or RELEASE_ID
    loaded = load_model_bundle(target_rel, threshold=threshold)
    return {
        "status": "reloaded" if loaded else ("fallback_active" if _is_ready else "not_ready"),
        "is_ready": _is_ready,
        "slot_id": SLOT_ID,
        "release_id": RELEASE_ID,
        "model_version": MODEL_VERSION,
        "decision_threshold": DECISION_THRESHOLD,
        "inference_mode": "pipeline" if _pipeline is not None else "heuristic",
    }


@app.get("/health", status_code=status.HTTP_200_OK)
@app.get("/livez", status_code=status.HTTP_200_OK)
def livez():
    """Liveness probe."""
    return {
        "status": "alive",
        "is_ready": _is_ready,
        "slot": SLOT_ID,
        "inference_mode": "pipeline" if _pipeline is not None else "heuristic",
    }


@app.get("/readyz", status_code=status.HTTP_200_OK)
def readyz():
    """Readiness probe verifying model is warmed and ready for traffic."""
    if not _is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Model bundle not loaded / service not ready"
        )
    return {
        "status": "ready",
        "is_ready": _is_ready,
        "slot": SLOT_ID,
        "release_id": RELEASE_ID,
        "threshold": DECISION_THRESHOLD,
        "inference_mode": "pipeline" if _pipeline is not None else "heuristic",
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
        "inference_mode": "pipeline" if _pipeline is not None else "heuristic",
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
        inference_mode="pipeline" if _pipeline is not None else "heuristic",
    )

