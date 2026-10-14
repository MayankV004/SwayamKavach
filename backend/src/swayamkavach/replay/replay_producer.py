"""Replay producer for simulating real-time Zeek flow ingestion batches.

Streams flow records from processed replay features into the SwayamKavach
ingestion API, simulating live edge sensors and IoT network capture.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pandas as pd
import requests

from schemas.flow_event import FlowEvent, NetworkIdentifiers, TONConnectionFeatures
from schemas.ingestion import BatchIngestRequest

logger = logging.getLogger("swayamkavach.replay")


def create_batch_from_df(
    df_chunk: pd.DataFrame,
    batch_id: str,
    sensor_id: str = "zeek-sensor-lab-01",
    schema_version: str = "ton-conn-11-v1",
) -> BatchIngestRequest:
    """Convert a DataFrame slice of replay features into a BatchIngestRequest."""
    events = []
    now = datetime.now(UTC)

    for _, row in df_chunk.iterrows():
        feat = TONConnectionFeatures(
            duration=float(row.get("duration", 0.0)),
            src_bytes=int(row.get("src_bytes", 0)),
            dst_bytes=int(row.get("dst_bytes", 0)),
            src_ip_bytes=int(row.get("src_ip_bytes", 0)),
            dst_ip_bytes=int(row.get("dst_ip_bytes", 0)),
            src_pkts=int(row.get("src_pkts", 0)),
            dst_pkts=int(row.get("dst_pkts", 0)),
            proto=str(row.get("proto", "tcp")),
            service=str(row.get("service", "-")),
            conn_state=str(row.get("conn_state", "SF")),
            missed_bytes=int(row.get("missed_bytes", 0)),
        )

        ident = NetworkIdentifiers(
            src_ip=str(row["src_ip"]) if pd.notna(row.get("src_ip")) else None,
            dst_ip=str(row["dst_ip"]) if pd.notna(row.get("dst_ip")) else None,
            src_port=int(row["src_port"]) if pd.notna(row.get("src_port")) and int(row["src_port"]) > 0 else None,
            dst_port=int(row["dst_port"]) if pd.notna(row.get("dst_port")) and int(row["dst_port"]) > 0 else None,
        )

        events.append(
            FlowEvent(
                event_id=str(row["event_id"]),
                sensor_id=sensor_id,
                event_time=now,
                features=feat,
                identifiers=ident,
            )
        )

    return BatchIngestRequest(
        batch_id=batch_id,
        sensor_id=sensor_id,
        schema_version=schema_version,
        extractor_id="zeek-replay-v1",
        events=events,
    )


def load_replay_batches(
    features_csv_path: Path,
    batch_size: int = 25,
    max_batches: int | None = None,
) -> list[BatchIngestRequest]:
    """Load replay features CSV and return a list of BatchIngestRequest objects."""
    if not features_csv_path.exists():
        raise FileNotFoundError(f"Replay features not found at {features_csv_path}")

    df = pd.read_csv(features_csv_path)
    total_rows = len(df)
    batches = []

    for i in range(0, total_rows, batch_size):
        if max_batches is not None and len(batches) >= max_batches:
            break
        chunk = df.iloc[i : i + batch_size]
        batch_id = f"replay-batch-{len(batches) + 1:04d}"
        batch_req = create_batch_from_df(chunk, batch_id=batch_id)
        batches.append(batch_req)

    return batches


def ingest_replay_stream(
    api_url: str = "http://localhost:8000/api/v1/ingestion/batches",
    batch_size: int = 25,
    max_batches: int = 10,
) -> dict[str, Any]:
    """Stream replay batches to the live API."""
    backend_dir = Path(__file__).resolve().parent.parent.parent.parent
    features_path = backend_dir / "data" / "processed" / "replay_features.csv.gz"
    batches = load_replay_batches(features_path, batch_size=batch_size, max_batches=max_batches)

    results = []
    for batch in batches:
        try:
            resp = requests.post(api_url, json=batch.model_dump(mode="json"), timeout=5.0)
            results.append({"batch_id": batch.batch_id, "status_code": resp.status_code, "resp": resp.json()})
        except Exception as e:
            results.append({"batch_id": batch.batch_id, "error": str(e)})

    return {"total_batches_sent": len(batches), "details": results}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    backend_dir = Path(__file__).resolve().parent.parent.parent.parent
    features_path = backend_dir / "data" / "processed" / "replay_features.csv.gz"
    batches = load_replay_batches(features_path, batch_size=20, max_batches=3)
    print(f"Loaded {len(batches)} sample replay batches. First batch event count: {len(batches[0].events)}")
