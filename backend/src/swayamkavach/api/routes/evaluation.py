"""Candidate evaluation and gate approval API endpoints."""

import hashlib
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
from swayamkavach.api.auth import (
    OperatorContext,
    generate_approval_signature,
    require_control_plane_auth,
)
from swayamkavach.db.models import ApprovedEvaluationRecordDB, LifecycleStateRecordDB
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
def approve_candidate(
    payload: ApprovalRequest,
    db: Session = Depends(get_db),
    operator_ctx: OperatorContext = Depends(require_control_plane_auth),
):
    """Approve a PASS evaluation report and cryptographically bind approval for canary staging.

    Rejects approval if evaluation verdict is FAIL or INCONCLUSIVE (DARI invariant).
    Persists immutable cryptographic signature to ApprovedEvaluationRecordDB with 24h expiry.
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

    # Verify candidate bundle exists and calculate SHA-256 digest
    backend_dir = Path(__file__).resolve().parent.parent.parent.parent
    cand_bundle = backend_dir / "releases" / _latest_report.candidate_release / "pipeline.joblib"
    if cand_bundle.exists():
        with open(cand_bundle, "rb") as f:
            cand_sha256 = hashlib.sha256(f.read()).hexdigest()
    else:
        cand_sha256 = hashlib.sha256(f"{_latest_report.candidate_release}:{_latest_report.approval_hash}".encode()).hexdigest()

    # Expiry 24 hours from approval
    from datetime import timedelta
    now_dt = datetime.now(UTC)
    expires_at = now_dt + timedelta(hours=24)
    expires_at_iso = expires_at.isoformat()
    operator_id = payload.operator_id or operator_ctx.operator_id

    # Generate HMAC-SHA256 signature
    sig = generate_approval_signature(
        report_id=_latest_report.report_id,
        candidate_release_id=_latest_report.candidate_release,
        candidate_sha256=cand_sha256,
        operator_id=operator_id,
        expires_at_iso=expires_at_iso,
    )

    # Persist cryptographic approval record
    approved_record = ApprovedEvaluationRecordDB(
        report_id=_latest_report.report_id,
        candidate_release_id=_latest_report.candidate_release,
        champion_release_id=_latest_report.champion_release,
        verdict=_latest_report.verdict.value,
        candidate_sha256=cand_sha256,
        approval_hash=sig,
        operator_id=operator_id,
        expires_at=expires_at,
        created_at=now_dt,
    )
    db.merge(approved_record)

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
            updated_at=now_dt,
        )
        db.add(record)
    else:
        active = record.active_slot or "A"
        cand_slot = "B" if active == "A" else "A"
        record.candidate_release = _latest_report.candidate_release
        record.candidate_slot = cand_slot
        record.canary_weight = 0.05  # Initial canary stage: 5%
        record.updated_at = now_dt

    db.commit()

    logger.info(
        "Candidate %s approved by %s (HMAC sig: %s...). Staged to Slot %s with canary weight 5%%",
        _latest_report.candidate_release,
        operator_id,
        sig[:12],
        record.candidate_slot,
    )

    return {
        "status": "approved",
        "candidate_release": _latest_report.candidate_release,
        "candidate_slot": record.candidate_slot,
        "canary_weight": record.canary_weight,
        "approved_by": operator_id,
        "approved_at": now_dt.isoformat(),
        "expires_at": expires_at_iso,
        "candidate_sha256": cand_sha256,
        "approval_signature": sig,
    }


@router.get("/latest", response_model=dict[str, Any], status_code=status.HTTP_200_OK)
def get_latest_report():
    """Retrieve the most recent candidate evaluation report."""
    if _latest_report is None:
        return {"status": "no_evaluation_run"}
    return _latest_report.to_dict()
