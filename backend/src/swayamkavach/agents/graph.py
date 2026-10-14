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
    y_true: list[int] | None
    fingerprint: dict[str, Any]
    selection_result: dict[str, Any]
    chosen_action: str
    calibration_result: dict[str, Any] | None
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

    calc = DamageCalculator()
    fp: DamageFingerprint = calc.compute_fingerprint(
        current_df=df,
        scores=scores,
        y_true=y_true,
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
    audit = list(state.get("audit_trail", []))
    audit.append(f"[{datetime.now(UTC).isoformat()}] Entered CalibrateNode (Action A1)")

    scores = state.get("scores", [])
    y_true = state.get("y_true")

    calibrator = ThresholdCalibrator()
    if y_true is not None and len(y_true) > 0 and len(scores) > 0:
        res = calibrator.calibrate(y_true=y_true, scores=scores[: len(y_true)])
    else:
        # Fallback conservative calibration
        res = calibrator.calibrate(
            y_true=[0, 1],
            scores=[0.1, 0.9],
            current_threshold=0.42,
        )

    audit.append(
        f"A1 Calibration complete: theta*={res.new_threshold:.3f} (Recall={res.recall:.4f}, FPR={res.fpr:.4f})"
    )

    return {
        "calibration_result": res.to_dict(),
        "audit_trail": audit,
        "status": "calibrated",
    }


def retrain_node(state: DARIState) -> dict[str, Any]:
    """Node 5 (A3): Resource-bounded subprocess retraining for candidate model."""
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
    """Node 6: Persist audit trail and update authoritative LifecycleStateRecordDB."""
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
    elif action == RepairAction.A3.value:
        return "retrain"
    # A0 and A2 (placeholder until Phase 6) route directly to audit
    return "audit"


def build_dari_graph() -> Any:
    """Construct and compile the DARI self-healing LangGraph state machine."""
    workflow = StateGraph(DARIState)

    # Register deterministic domain nodes
    workflow.add_node("monitor", monitor_node)
    workflow.add_node("damage", damage_node)
    workflow.add_node("selector", selector_node)
    workflow.add_node("calibrate", calibrate_node)
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
            "retrain": "retrain",
            "audit": "audit",
        },
    )

    # Terminal convergence
    workflow.add_edge("calibrate", "audit")
    workflow.add_edge("retrain", "audit")
    workflow.add_edge("audit", END)

    return workflow.compile()
