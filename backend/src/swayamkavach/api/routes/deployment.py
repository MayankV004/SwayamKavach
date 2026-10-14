"""Two-slot deployment, canary traffic stepping, and warm rollback endpoints."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

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
def stage_candidate(payload: StageCandidateRequest, db: Session = Depends(get_db)):
    """Stage approved candidate into inactive slot with initial canary weight (5%)."""
    state = controller.stage_candidate(
        db,
        candidate_release=payload.candidate_release_id,
        initial_weight=payload.initial_weight,
    )
    return state.to_dict()


@router.post("/canary/advance", response_model=dict[str, Any], status_code=status.HTTP_200_OK)
def advance_canary_stage(db: Session = Depends(get_db)):
    """Advance canary traffic weight to next stage (5% -> 25% -> 50% -> 100%).

    When advancing past 50%, automatically promotes candidate to champion!
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
def trigger_rollback(payload: RollbackRequest, db: Session = Depends(get_db)):
    """Execute immediate zero-downtime warm rollback to champion."""
    state = controller.warm_rollback(db, reason=payload.reason)
    return state.to_dict()
