"""Candidate evaluation and gate approval API endpoints."""

import json
import logging
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from schemas.lifecycle import EvaluationVerdict
from swayamkavach.db.models import LifecycleStateRecordDB
from swayamkavach.db.session import get_db
from swayamkavach.evaluation.compare import EvaluationReport, ModelComparator

logger = logging.getLogger("swayamkavach.api.evaluation")
router = APIRouter(prefix="/evaluations", tags=["Evaluation"])


class EvaluateCandidateRequest(BaseModel):
    """Payload to trigger paired candidate vs champion evaluation."""

    model_config = ConfigDict(extra="forbid")

    candidate_release_id: str = Field(..., description="Release ID of candidate to evaluate (e.g. R2-candidate)")
    champion_release_id: str = Field(default="R1", description="Active champion release ID")


class ApprovalRequest(BaseModel):
    """Operator approval payload to stage approved candidate into canary slot."""

    model_config = ConfigDict(extra="forbid")

    report_id: str = Field(..., description="ID of evaluation report to approve")
    approval_hash: str = Field(..., description="Cryptographic SHA-256 approval hash")
    operator_id: str = Field(default="lead_engineer", description="Identifier of approving operator or controller")


_latest_report: EvaluationReport | None = None


@router.post("/compare", response_model=dict[str, Any], status_code=status.HTTP_200_OK)
def compare_candidate(payload: EvaluateCandidateRequest):
    """Run paired statistical comparison between Champion and Candidate model.

    Enforces hard non-regression gates and outputs PASS / FAIL / INCONCLUSIVE report.
    """
    global _latest_report

    backend_dir = Path(__file__).resolve().parent.parent.parent.parent
    champ_dir = backend_dir / "releases" / payload.champion_release_id
    cand_dir = backend_dir / "releases" / payload.candidate_release_id

    champ_pipeline_path = champ_dir / "pipeline.joblib"
    cand_pipeline_path = cand_dir / "pipeline.joblib"

    if not champ_pipeline_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Champion bundle not found at {champ_pipeline_path}",
        )
    if not cand_pipeline_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate bundle not found at {cand_pipeline_path}",
        )

    val_csv = backend_dir / "data" / "processed" / "val.csv.gz"
    if not val_csv.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Validation dataset not found at {val_csv}",
        )

    champ_pipeline = joblib.load(champ_pipeline_path)
    cand_pipeline = joblib.load(cand_pipeline_path)
    val_df = pd.read_csv(val_csv)

    # Read thresholds from manifests if available
    champ_manifest = champ_dir / "manifest.json"
    champ_theta = 0.42
    if champ_manifest.exists():
        with open(champ_manifest, encoding="utf-8") as f:
            champ_theta = json.load(f).get("decision_threshold", 0.42)

    cand_manifest = cand_dir / "manifest.json"
    cand_theta = 0.42
    if cand_manifest.exists():
        with open(cand_manifest, encoding="utf-8") as f:
            cand_theta = json.load(f).get("decision_threshold", 0.42)

    comparator = ModelComparator()
    report = comparator.compare(
        champion_pipeline=champ_pipeline,
        candidate_pipeline=cand_pipeline,
        val_df=val_df,
        champion_release=payload.champion_release_id,
        candidate_release=payload.candidate_release_id,
        champion_threshold=champ_theta,
        candidate_threshold=cand_theta,
    )

    _latest_report = report
    return report.to_dict()


@router.post("/approve", response_model=dict[str, Any], status_code=status.HTTP_200_OK)
def approve_candidate(payload: ApprovalRequest, db: Session = Depends(get_db)):
    """Approve a PASS evaluation report and assign candidate to inactive serving slot.

    Rejects approval if evaluation verdict is FAIL or INCONCLUSIVE (DARI invariant).
    """
    global _latest_report

    if _latest_report is None or _latest_report.report_id != payload.report_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evaluation report {payload.report_id} not found or expired.",
        )

    if _latest_report.approval_hash != payload.approval_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approval hash mismatch. Potential tampering detected.",
        )

    if _latest_report.verdict != EvaluationVerdict.PASS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cannot approve candidate with verdict {_latest_report.verdict.value}. "
                   f"Only PASS candidates may enter canary staging. Rejections: {_latest_report.rejection_reasons}",
        )

    # Assign candidate to inactive slot
    record = db.query(LifecycleStateRecordDB).first()
    if record is None:
        record = LifecycleStateRecordDB(
            id=1,
            champion_release=_latest_report.champion_release,
            active_slot="A",
            candidate_release=_latest_report.candidate_release,
            candidate_slot="B",
            canary_weight=0.05,
            updated_at=datetime.now(UTC),
        )
        db.add(record)
    else:
        active = record.active_slot or "A"
        cand_slot = "B" if active == "A" else "A"
        record.candidate_release = _latest_report.candidate_release
        record.candidate_slot = cand_slot
        record.canary_weight = 0.05  # Initial canary stage: 5%
        record.updated_at = datetime.now(UTC)

    db.commit()

    logger.info(
        "Candidate %s approved by %s. Staged to Slot %s with canary weight 5%%",
        _latest_report.candidate_release,
        payload.operator_id,
        record.candidate_slot,
    )

    return {
        "status": "approved",
        "candidate_release": _latest_report.candidate_release,
        "candidate_slot": record.candidate_slot,
        "canary_weight": record.canary_weight,
        "approved_by": payload.operator_id,
        "approved_at": datetime.now(UTC).isoformat(),
    }


@router.get("/latest", response_model=dict[str, Any], status_code=status.HTTP_200_OK)
def get_latest_report():
    """Retrieve the most recent candidate evaluation report."""
    if _latest_report is None:
        return {"status": "no_evaluation_run"}
    return _latest_report.to_dict()
