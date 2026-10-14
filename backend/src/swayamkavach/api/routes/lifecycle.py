"""Lifecycle state query routes."""

import json
import logging
from datetime import UTC, datetime
from pathlib import Path

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from schemas.lifecycle import DamageFingerprint, LifecycleState, RepairAction
from swayamkavach.damage.calculator import DamageCalculator
from swayamkavach.db.models import LifecycleStateRecordDB
from swayamkavach.db.session import get_db
from swayamkavach.monitoring.window import WindowSelector

logger = logging.getLogger("swayamkavach.api.lifecycle")
router = APIRouter(prefix="/lifecycle", tags=["Lifecycle"])


@router.get("", response_model=LifecycleState, status_code=status.HTTP_200_OK)
def get_lifecycle_state(db: Session = Depends(get_db)):
    """Retrieve the authoritative deployment and DARI self-healing lifecycle state."""
    # Check for release R1 manifest to verify active champion
    backend_dir = Path(__file__).resolve().parent.parent.parent.parent
    r1_manifest = backend_dir / "releases" / "R1" / "manifest.json"

    champion = "R1"
    if r1_manifest.exists():
        try:
            with open(r1_manifest, encoding="utf-8") as f:
                data = json.load(f)
                champion = data.get("release_id", "R1")
        except Exception:
            champion = "R1"

    # 1. Check if an authoritative lifecycle record exists in DB
    record = db.query(LifecycleStateRecordDB).first()
    if record:
        fingerprint = None
        if record.last_fingerprint:
            fingerprint = DamageFingerprint(**record.last_fingerprint)
        else:
            # Dynamically compute from latest window
            window = WindowSelector().select_latest_window(db, window_size=500)
            if window is not None and len(window.features_df) > 0:
                calc = DamageCalculator()
                fingerprint = calc.compute_fingerprint(
                    current_df=window.features_df,
                    scores=window.scores,
                    y_true=window.y_true,
                    label_reliability=window.label_reliability,
                )

        if fingerprint is None:
            fingerprint = DamageFingerprint(
                D_X=0.012,
                D_Y=0.008,
                D_B=0.045,
                Q=0.999,
                L=0.985,
                S=2000,
                R=1,
            )

        action = RepairAction(record.last_action) if record.last_action in RepairAction.__members__ else RepairAction.A0

        return LifecycleState(
            champion_release=record.champion_release or champion,
            active_slot=record.active_slot or "A",
            candidate_release=record.candidate_release,
            candidate_slot=record.candidate_slot,
            canary_weight=record.canary_weight,
            last_fingerprint=fingerprint,
            chosen_action=action,
            updated_at=record.updated_at.replace(tzinfo=UTC) if record.updated_at.tzinfo is None else record.updated_at,
        )

    # 2. If no DB record exists yet, attempt dynamic calculation or fallback
    window = WindowSelector().select_latest_window(db, window_size=500)
    if window is not None and len(window.features_df) > 0:
        calc = DamageCalculator()
        fingerprint = calc.compute_fingerprint(
            current_df=window.features_df,
            scores=window.scores,
            y_true=window.y_true,
            label_reliability=window.label_reliability,
        )
    else:
        fingerprint = DamageFingerprint(
            D_X=0.012,
            D_Y=0.008,
            D_B=0.045,
            Q=0.999,
            L=0.985,
            S=2000,
            R=1,
        )

    return LifecycleState(
        champion_release=champion,
        active_slot="A",
        candidate_release=None,
        candidate_slot=None,
        canary_weight=0.0,
        last_fingerprint=fingerprint,
        chosen_action=RepairAction.A0,
        updated_at=datetime.now(UTC),
    )
