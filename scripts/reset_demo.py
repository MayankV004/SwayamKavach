#!/usr/bin/env python3
"""SwayamKavach — Idempotent Demo Reset Script.

Restores the demonstration platform to its clean nominal baseline:
  - Champion: Release R1 on Slot A (:8001)
  - Standby Slot: Slot B (:8002)
  - Canary Weight: 0.0 (100% Champion)
  - DARI Fingerprint: Nominal (D_X=0.012, D_Y=0.008, D_B=0.045, Q=0.999, L=0.985, S=2000, R=1)
  - Action: A0 (Baseline)
"""

from __future__ import annotations

import sys
from datetime import UTC, datetime
from pathlib import Path

# Ensure backend/src is in sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir / "src"))
sys.path.insert(0, str(backend_dir))

from swayamkavach.db.models import LifecycleStateRecordDB
from swayamkavach.db.session import SessionLocal, init_db


def reset_demo() -> None:
    init_db()
    db = SessionLocal()
    nominal_fp = {
        "D_X": 0.012,
        "D_Y": 0.008,
        "D_B": 0.045,
        "Q": 0.999,
        "L": 0.985,
        "S": 2000,
        "R": 1,
    }

    try:
        record = db.query(LifecycleStateRecordDB).first()
        if record is None:
            record = LifecycleStateRecordDB(
                id=1,
                champion_release="R1",
                active_slot="A",
                candidate_release=None,
                candidate_slot=None,
                canary_weight=0.0,
                last_action="A0",
                last_fingerprint=nominal_fp,
                updated_at=datetime.now(UTC),
            )
            db.add(record)
        else:
            record.champion_release = "R1"
            record.active_slot = "A"
            record.candidate_release = None
            record.candidate_slot = None
            record.canary_weight = 0.0
            record.last_action = "A0"
            record.last_fingerprint = nominal_fp
            record.updated_at = datetime.now(UTC)

        db.commit()
    finally:
        db.close()

    # Reset running serving slots if active
    try:
        import httpx

        with httpx.Client(timeout=1.0) as client:
            client.post("http://localhost:8001/reload", params={"release_id": "R1", "threshold": 0.42})
            client.post("http://localhost:8002/reload", params={"release_id": "R1", "threshold": 0.42})
    except Exception:
        pass

    # Stop active streams if API is active
    try:
        import httpx

        with httpx.Client(timeout=1.0) as client:
            client.post("http://localhost:8000/api/v1/stream/all/stop")
    except Exception:
        pass

    print("======================================================================")
    print("  ✓ SwayamKavach Demo Reset Complete (Nominal Baseline Restored)     ")
    print("======================================================================")
    print("  - Active Champion: Release R1 on Slot A (http://localhost:8001)")
    print("  - Standby Slot:    Slot B (http://localhost:8002)")
    print("  - Canary Weight:   0% (100% Champion)")
    print("  - DARI Action:     A0 (Nominal Baseline)")
    print("  - Fingerprint:     D_X=0.012, D_Y=0.008, D_B=0.045, Q=0.999, S=2000")
    print("======================================================================")


if __name__ == "__main__":
    reset_demo()
