"""Two-slot deployment, canary traffic stepping, and warm rollback endpoints."""

import hashlib
import logging
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from swayamkavach.api.auth import (
    OperatorContext,
    require_control_plane_auth,
    verify_approval_signature,
)
from swayamkavach.db.models import ApprovedEvaluationRecordDB
from swayamkavach.db.session import get_db
from swayamkavach.deployment.canary import CanaryController

logger = logging.getLogger("swayamkavach.api.deployment")
router = APIRouter(prefix="/deployment", tags=["Deployment"])

controller = CanaryController()


class StageCandidateRequest(BaseModel):
    """Request payload to stage a candidate model into the inactive slot."""

    model_config = ConfigDict(extra="forbid")

    candidate_release_id: str = Field(..., description="Release ID to stage (e.g. R2-candidate)")
    initial_weight: float = Field(default=0.05, ge=0.0, le=1.0)


class RollbackRequest(BaseModel):
    """Payload to trigger immediate warm rollback."""

    model_config = ConfigDict(extra="forbid")

    reason: str = Field(default="Watchdog alert or manual abort", description="Audit reason for rollback")


@router.get("/state", response_model=dict[str, Any], status_code=status.HTTP_200_OK)
def get_deployment_state(db: Session = Depends(get_db)):
    """Retrieve authoritative two-slot canary state and traffic distribution."""
    state = controller.get_state(db)
    return state.to_dict()


@router.post("/canary/stage", response_model=dict[str, Any], status_code=status.HTTP_200_OK)
def stage_candidate(
    payload: StageCandidateRequest,
    db: Session = Depends(get_db),
    operator_ctx: OperatorContext = Depends(require_control_plane_auth),
):
    """Stage approved candidate into inactive slot with initial canary weight (5%).

    Enforces that candidate has an authentic, unexpired cryptographic approval with PASS verdict.
    """
    # 1. Query persisted evaluation approval
    approved = (
        db.query(ApprovedEvaluationRecordDB)
        .filter(ApprovedEvaluationRecordDB.candidate_release_id == payload.candidate_release_id)
        .order_by(ApprovedEvaluationRecordDB.created_at.desc())
        .first()
    )

    if not approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Candidate {payload.candidate_release_id} has not received cryptographic evaluation approval. "
                   "Run paired evaluation and obtain operator approval before canary staging.",
        )

    if approved.verdict != "PASS":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Candidate {payload.candidate_release_id} failed evaluation gates (verdict: {approved.verdict}). "
                   "Only PASS candidates may be staged into canary.",
        )

    now_dt = datetime.now(UTC)
    expiry = approved.expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=UTC)

    if expiry < now_dt:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Evaluation approval for {payload.candidate_release_id} expired at {approved.expires_at.isoformat()}. "
                   "A fresh evaluation is required.",
        )

    # 2. Verify candidate artifact sha256 digest integrity
    backend_dir = Path(__file__).resolve().parent.parent.parent.parent
    bundle_path = backend_dir / "releases" / payload.candidate_release_id / "pipeline.joblib"
    if bundle_path.exists():
        with open(bundle_path, "rb") as f:
            actual_sha = hashlib.sha256(f.read()).hexdigest()
        if actual_sha != approved.candidate_sha256:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Candidate artifact integrity mismatch for {payload.candidate_release_id}. "
                       "Artifact modified after approval.",
            )

    # 3. Verify HMAC signature authenticity
    is_valid_sig = verify_approval_signature(
        signature=approved.approval_hash,
        report_id=approved.report_id,
        candidate_release_id=approved.candidate_release_id,
        candidate_sha256=approved.candidate_sha256,
        operator_id=approved.operator_id,
        expires_at_iso=approved.expires_at.isoformat(),
    )
    if not is_valid_sig:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cryptographic approval signature verification failed. Potential tampering detected.",
        )

    state = controller.stage_candidate(
        db,
        candidate_release=payload.candidate_release_id,
        initial_weight=payload.initial_weight,
    )
    return state.to_dict()


@router.post("/canary/advance", response_model=dict[str, Any], status_code=status.HTTP_200_OK)
def advance_canary_stage(
    db: Session = Depends(get_db),
    operator_ctx: OperatorContext = Depends(require_control_plane_auth),
):
    """Advance canary traffic weight to next stage (5% -> 25% -> 50% -> 100%).

    When advancing past 50%, automatically promotes candidate to champion!
    Requires authenticated operator control-plane authorization.
    """
    try:
        state = controller.advance_stage(db)
        return state.to_dict()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post("/canary/rollback", response_model=dict[str, Any], status_code=status.HTTP_200_OK)
def trigger_rollback(
    payload: RollbackRequest,
    db: Session = Depends(get_db),
    operator_ctx: OperatorContext = Depends(require_control_plane_auth),
):
    """Execute immediate zero-downtime warm rollback to champion.

    Requires authenticated operator control-plane authorization.
    """
    state = controller.warm_rollback(db, reason=payload.reason)
    return state.to_dict()
