"""LangGraph Orchestrator for DARI Autonomous Self-Healing Lifecycle.

Orchestrates deterministic domain logic:
  Monitor -> DamageCalculator -> DARISelector -> Remediation Router (A0/A1/A2/A3) -> Audit Trail

Invariants (Rule 6):
  - LangGraph orchestrates domain logic; it is not the security authority.
  - Nodes have small, typed contracts with single responsibilities.
  - All safety gates (feasibility, constraints, limits) are deterministic and testable.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from schemas.lifecycle import DamageFingerprint, RepairAction
from swayamkavach.damage.calculator import DamageCalculator
from swayamkavach.damage.persistence import PersistenceTracker
from swayamkavach.dari.adapter import LocalSubspaceAdapter
from swayamkavach.dari.calibrator import ThresholdCalibrator
from swayamkavach.dari.retrainer import SubprocessRetrainer
from swayamkavach.dari.selector import DARISolver, SelectionResult
from swayamkavach.db.models import LifecycleStateRecordDB
from swayamkavach.db.session import SessionLocal
from swayamkavach.monitoring.window import MonitoringWindow, WindowSelector

logger = logging.getLogger("swayamkavach.agents.graph")


class DARIState(TypedDict, total=False):
    """Immutable state machine context passed through LangGraph nodes."""

    window_id: str
    sample_count: int
    features_records: list[dict[str, Any]]
    scores: list[float]
    y_true: list[int | None] | None
    fingerprint: dict[str, Any]
    selection_result: dict[str, Any]
    chosen_action: str
    calibration_result: dict[str, Any] | None
    adaptation_result: dict[str, Any] | None
    retraining_result: dict[str, Any] | None
    audit_trail: list[str]
    status: str


def monitor_node(state: DARIState) -> dict[str, Any]:
    """Node 1: Extract monitoring window from DB or preserve state window."""
    audit = list(state.get("audit_trail", []))
    audit.append(f"[{datetime.now(UTC).isoformat()}] Entered MonitorNode")

    # If window data already supplied (e.g. from tests or caller), pass through
    if state.get("window_id") and state.get("features_records"):
        audit.append(f"Using supplied window {state.get('window_id')} ({state.get('sample_count')} samples)")
        return {"audit_trail": audit, "status": "monitored"}

    # Query DB for latest window
    db = SessionLocal()
    try:
        window: MonitoringWindow | None = WindowSelector().select_latest_window(db, window_size=500)
        if window is None or len(window.features_df) == 0:
            audit.append("No active predicted events in window. Defaulting to nominal.")
            return {
                "window_id": "W_nominal_0",
                "sample_count": 0,
                "features_records": [],
                "scores": [],
                "y_true": None,
                "audit_trail": audit,
                "status": "idle",
            }

        audit.append(f"Extracted window {window.window_id} with {window.sample_count} events.")
        return {
            "window_id": window.window_id,
            "sample_count": window.sample_count,
            "features_records": window.features_df.to_dict(orient="records"),
            "scores": window.scores,
            "y_true": window.y_true,
            "audit_trail": audit,
            "status": "monitored",
        }
    finally:
        db.close()


def damage_node(state: DARIState) -> dict[str, Any]:
    """Node 2: Calculate explicit 7D damage fingerprint F_t = [D_X, D_Y, D_B, Q, L, S, R]."""
    audit = list(state.get("audit_trail", []))
    audit.append(f"[{datetime.now(UTC).isoformat()}] Entered DamageCalculatorNode")

    # If fingerprint already supplied in state, reuse
    if state.get("fingerprint"):
        return {"audit_trail": audit, "status": "diagnosed"}

    import pandas as pd

    records = state.get("features_records", [])
    df = pd.DataFrame(records) if records else pd.DataFrame()
    scores = state.get("scores", [])
    y_true = state.get("y_true")

    # Compute persistence R from history
    persistence_count = 1
    window_id = state.get("window_id", f"W_live_{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}")
    try:
        db = SessionLocal()
        try:
            tracker = PersistenceTracker()
            calc_temp = DamageCalculator()
            d_x = calc_temp.compute_distribution_drift(df)
            d_b = calc_temp.compute_boundary_damage(scores)
            d_y = calc_temp.compute_performance_damage(y_true, scores)
            q = calc_temp.compute_data_quality(df)
            valid_cnt = sum(1 for y in y_true if y is not None and not pd.isna(y)) if y_true else 0
            cov = valid_cnt / len(y_true) if (y_true and len(y_true) > 0) else 0.0
            persistence_count = tracker.record_and_compute_persistence(
                db=db,
                window_id=window_id,
                d_x=d_x,
                d_y=d_y,
                d_b=d_b,
                q=q,
                l=0.95 * cov,
                s=len(df),
            )
        finally:
            db.close()
    except Exception as exc:
        logger.debug("Database persistence tracking bypassed or unavailable: %s", exc)

    calc = DamageCalculator()
    fp: DamageFingerprint = calc.compute_fingerprint(
        current_df=df,
        scores=scores,
        y_true=y_true,
        persistence_count=persistence_count,
    )

    audit.append(
        f"Calculated 7D Fingerprint: D_X={fp.D_X:.3f}, D_Y={fp.D_Y}, D_B={fp.D_B:.3f}, Q={fp.Q:.3f}, S={fp.S}, R={fp.R}"
    )

    return {
        "fingerprint": fp.model_dump(),
        "audit_trail": audit,
        "status": "diagnosed",
    }


def selector_node(state: DARIState) -> dict[str, Any]:
    """Node 3: Deterministic DARI Solver (Feasibility -> Net Utility -> Tie-break)."""
    audit = list(state.get("audit_trail", []))
    audit.append(f"[{datetime.now(UTC).isoformat()}] Entered DARISelectorNode")

    fp_dict = state.get("fingerprint", {})
    fp = DamageFingerprint(**fp_dict)

    solver = DARISolver()
    decision: SelectionResult = solver.select_action(fp)

    audit.append(
        f"DARI Solver selected {decision.chosen_action.value} (feasible: {[a.value for a in decision.feasible_actions]})"
    )
    audit.append(f"Explanation: {decision.explanation}")

    return {
        "selection_result": decision.to_dict(),
        "chosen_action": decision.chosen_action.value,
        "audit_trail": audit,
        "status": "selected",
    }


def calibrate_node(state: DARIState) -> dict[str, Any]:
    """Node 4 (A1): Hot threshold recalibration without retraining."""
    import pandas as pd

    audit = list(state.get("audit_trail", []))
    audit.append(f"[{datetime.now(UTC).isoformat()}] Entered CalibrateNode (Action A1)")

    scores = state.get("scores", [])
    y_true = state.get("y_true")

    calibrator = ThresholdCalibrator()
    if y_true is not None and len(y_true) > 0 and len(scores) > 0:
        # Extract aligned labeled events without fabrication
        valid_indices = [i for i, y in enumerate(y_true) if y is not None and not pd.isna(y)]
        if valid_indices and len(scores) >= max(valid_indices) + 1:
            eval_y = [int(y_true[i]) for i in valid_indices]  # type: ignore[arg-type]
            eval_s = [float(scores[i]) for i in valid_indices]
            res = calibrator.calibrate(y_true=eval_y, scores=eval_s)
        else:
            res = calibrator.calibrate(y_true=[], scores=[])
    else:
        res = calibrator.calibrate(y_true=[], scores=[])

    if res.meets_constraints and res.status == "SUCCESS":
        audit.append(
            f"A1 Calibration complete: theta*={res.new_threshold:.3f} (Recall={res.recall:.4f}, FPR={res.fpr:.4f})"
        )
        # Propagate hot threshold update to active model serving runtime
        try:
            import httpx
            with httpx.Client(timeout=1.0) as client:
                client.post("http://localhost:8001/reload", params={"threshold": res.new_threshold})
                client.post("http://localhost:8002/reload", params={"threshold": res.new_threshold})
            audit.append(f"Successfully activated calibrated threshold theta*={res.new_threshold:.3f} on serving slots.")
        except Exception:
            audit.append(f"Serving slot unreachable; recorded calibrated threshold theta*={res.new_threshold:.3f} in state.")
    else:
        audit.append(
            f"A1 Calibration deferred ({res.status}): security constraints not satisfied or evidence missing. Current threshold retained."
        )

    return {
        "calibration_result": res.to_dict(),
        "audit_trail": audit,
        "status": "calibrated" if res.meets_constraints else "calibration_inconclusive",
    }


def adapt_node(state: DARIState) -> dict[str, Any]:
    """Node 5 (A2): Localized targeted subspace adaptation for candidate model."""
    audit = list(state.get("audit_trail", []))
    audit.append(f"[{datetime.now(UTC).isoformat()}] Entered AdaptNode (Action A2)")

    features = state.get("features_records", [])
    y_true = state.get("y_true") or []
    candidate_id = f"R2-adapted-{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}"

    adapter = LocalSubspaceAdapter()
    res = adapter.adapt_candidate(
        features=features,
        y_true=y_true,
        candidate_release_id=candidate_id,
    )

    audit.append(
        f"A2 Adaptation {res.status} in {res.adaptation_duration_seconds}s for release {res.candidate_release_id}"
    )

    return {
        "adaptation_result": res.to_dict(),
        "audit_trail": audit,
        "status": "adapted" if res.status == "success" else "adaptation_deferred",
    }


def retrain_node(state: DARIState) -> dict[str, Any]:
    """Node 6 (A3): Resource-bounded subprocess retraining for candidate model."""
    audit = list(state.get("audit_trail", []))
    audit.append(f"[{datetime.now(UTC).isoformat()}] Entered RetrainNode (Action A3)")

    retrainer = SubprocessRetrainer(max_threads=2, timeout_seconds=180)
    candidate_id = f"R2-candidate-{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}"

    res = retrainer.retrain_candidate(candidate_release_id=candidate_id)
    audit.append(
        f"A3 Retraining {res.status} in {res.training_duration_seconds}s for release {res.candidate_release_id}"
    )

    return {
        "retraining_result": res.to_dict(),
        "audit_trail": audit,
        "status": "retrained" if res.status == "success" else "retrain_failed",
    }


def audit_node(state: DARIState) -> dict[str, Any]:
    """Node 7: Persist audit trail and update authoritative LifecycleStateRecordDB."""
    audit = list(state.get("audit_trail", []))
    audit.append(f"[{datetime.now(UTC).isoformat()}] Entered AuditNode (Lifecycle Finalized)")

    action = state.get("chosen_action", "A0")
    fp_dict = state.get("fingerprint")

    # Persist authoritative lifecycle state to DB
    db = SessionLocal()
    try:
        record = db.query(LifecycleStateRecordDB).first()
        if record is None:
            record = LifecycleStateRecordDB(
                id=1,
                champion_release="R1",
                active_slot="A",
                last_action=action,
                last_fingerprint=fp_dict,
                updated_at=datetime.now(UTC),
            )
            db.add(record)
        else:
            record.last_action = action
            record.last_fingerprint = fp_dict
            record.updated_at = datetime.now(UTC)

        db.commit()
        audit.append(f"Persisted lifecycle state in database (action={action})")
    except Exception as exc:
        db.rollback()
        audit.append(f"Warning: Failed to persist lifecycle state: {exc}")
    finally:
        db.close()

    return {"audit_trail": audit, "status": "completed"}


def router_node(state: DARIState) -> str:
    """Conditional router branching on chosen DARI action."""
    action = state.get("chosen_action", "A0")
    if action == RepairAction.A1.value:
        return "calibrate"
    elif action == RepairAction.A2.value:
        return "adapt"
    elif action == RepairAction.A3.value:
        return "retrain"
    return "audit"


def build_dari_graph() -> Any:
    """Construct and compile the DARI self-healing LangGraph state machine."""
    workflow = StateGraph(DARIState)

    # Register deterministic domain nodes
    workflow.add_node("monitor", monitor_node)
    workflow.add_node("damage", damage_node)
    workflow.add_node("selector", selector_node)
    workflow.add_node("calibrate", calibrate_node)
    workflow.add_node("adapt", adapt_node)
    workflow.add_node("retrain", retrain_node)
    workflow.add_node("audit", audit_node)

    # Establish linear flow: Monitor -> Damage -> Selector
    workflow.set_entry_point("monitor")
    workflow.add_edge("monitor", "damage")
    workflow.add_edge("damage", "selector")

    # Conditional routing after Selector
    workflow.add_conditional_edges(
        "selector",
        router_node,
        {
            "calibrate": "calibrate",
            "adapt": "adapt",
            "retrain": "retrain",
            "audit": "audit",
        },
    )

    # Terminal convergence
    workflow.add_edge("calibrate", "audit")
    workflow.add_edge("adapt", "audit")
    workflow.add_edge("retrain", "audit")
    workflow.add_edge("audit", END)

    return workflow.compile()

