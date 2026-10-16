"""API routes for running replay scenarios and baseline benchmarks."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from datetime import UTC, datetime
from swayamkavach.db.models import LifecycleStateRecordDB
from swayamkavach.db.session import get_db
from swayamkavach.experiments.benchmark import BaselineBenchmarkHarness
from swayamkavach.experiments.scenarios import ReplayScenarioRunner, ScenarioType

logger = logging.getLogger("swayamkavach.api.experiments")

router = APIRouter(prefix="/experiments", tags=["experiments"])


class ScenarioRunRequest(BaseModel):
    """Payload to trigger an autonomous scenario simulation."""

    scenario: ScenarioType = Field(
        ...,
        description="Scenario to execute (nominal, boundary_shift, localized_cluster, severe_attack, faulty_candidate_rejection, canary_watchdog_rollback, corrupted_data_rejection, unlabelled_stream_safety)",
    )


@router.post("/scenarios/run")
def run_scenario(
    request: ScenarioRunRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Execute an autonomous IoT intrusion detection scenario and verify DARI invariants."""
    runner = ReplayScenarioRunner()

    try:
        match request.scenario:
            case ScenarioType.NOMINAL:
                result = runner.run_nominal_scenario()
            case ScenarioType.BOUNDARY_SHIFT:
                result = runner.run_boundary_shift_scenario()
            case ScenarioType.LOCALIZED_CLUSTER:
                result = runner.run_localized_cluster_scenario()
            case ScenarioType.SEVERE_ATTACK:
                result = runner.run_severe_attack_scenario(db=db)
            case ScenarioType.FAULTY_CANDIDATE_REJECTION:
                result = runner.run_faulty_candidate_rejection_scenario()
            case ScenarioType.CANARY_WATCHDOG_ROLLBACK:
                result = runner.run_canary_watchdog_rollback_scenario(db=db)
            case ScenarioType.CORRUPTED_DATA_REJECTION:
                result = runner.run_corrupted_data_rejection_scenario()
            case ScenarioType.UNLABELLED_STREAM_SAFETY:
                result = runner.run_unlabelled_stream_scenario()
            case _:
                raise HTTPException(status_code=400, detail=f"Unsupported scenario: {request.scenario}")

        # Update lifecycle state in DB so all dashboard components see the new fingerprint and action
        record = db.query(LifecycleStateRecordDB).first()
        if not record:
            record = LifecycleStateRecordDB(
                champion_release="R1",
                active_slot="A",
                canary_weight=0.0,
            )
            db.add(record)

        record.last_fingerprint = result.fingerprint.model_dump()
        record.last_action = result.chosen_action.value
        record.updated_at = datetime.now(UTC)
        db.commit()

        logger.info("Executed scenario %s -> Action %s", result.scenario.value, result.chosen_action.value)
        return result.to_dict()

    except Exception as e:
        logger.error("Error executing scenario %s: %s", request.scenario, e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/benchmark")
def get_benchmark(
    n_windows: int = Query(default=10, ge=3, le=50, description="Number of stream windows to evaluate"),
) -> dict[str, Any]:
    """Benchmark DARI against Static Champion, Periodic Retraining, and Retrain-All."""
    try:
        harness = BaselineBenchmarkHarness()
        report = harness.run_benchmark(n_windows=n_windows)
        return report.to_dict()
    except Exception as e:
        logger.error("Error running baseline benchmark: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) from e
