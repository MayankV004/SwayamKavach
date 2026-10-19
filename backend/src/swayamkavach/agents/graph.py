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
from swayamkavach.db.models import EvaluationReportRecordDB, LifecycleStateRecordDB
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
    candidate_release_id: str | None
    evaluation_report: dict[str, Any] | None
    lifecycle_stage: str
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
        import os
        window_size = int(os.getenv("MONITORING_WINDOW_SIZE", "1000"))
        window: MonitoringWindow | None = WindowSelector().select_latest_window(db, window_size=window_size)
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

    calibration_state: str
    proposed_threshold: float | None = None
    confirmed_threshold: float | None = None

    if not (res.meets_constraints and res.status == "SUCCESS"):
        calibration_state = "CALIBRATION_INCONCLUSIVE"
        audit.append(
            f"A1 Calibration deferred ({res.status}): security constraints not satisfied or evidence missing. Current threshold retained."
        )
    else:
        proposed_threshold = float(res.new_threshold)
        audit.append(
            f"A1 Calibration computed: proposed theta*={proposed_threshold:.3f} (Recall={res.recall:.4f}, FPR={res.fpr:.4f})"
        )
        verified_slots: list[str] = []
        failed_slots: list[str] = []
        contacted_slots: list[str] = []

        try:
            import httpx
            with httpx.Client(timeout=2.0) as client:
                for port, slot_name in [(8001, "Slot A"), (8002, "Slot B")]:
                    try:
                        reload_resp = client.post(
                            f"http://127.0.0.1:{port}/reload",
                            params={"threshold": proposed_threshold},
                        )
                        contacted_slots.append(slot_name)
                        if reload_resp.status_code == 200:
                            probe_resp = client.get(f"http://127.0.0.1:{port}/readyz")
                            if probe_resp.status_code == 200:
                                probe_data = probe_resp.json()
                                active_t = float(probe_data.get("threshold", 0.0))
                                if abs(active_t - proposed_threshold) < 0.01:
                                    verified_slots.append(slot_name)
                                else:
                                    failed_slots.append(
                                        f"{slot_name} returned mismatched threshold {active_t} (expected {proposed_threshold})"
                                    )
                            else:
                                failed_slots.append(f"{slot_name} readyz returned HTTP {probe_resp.status_code}")
                        else:
                            failed_slots.append(f"{slot_name} reload returned HTTP {reload_resp.status_code}")
                    except Exception as slot_exc:
                        logger.debug("Serving %s on port %s unreachable: %s", slot_name, port, slot_exc)

            if len(verified_slots) == 2:
                calibration_state = "ACTIVATION_VERIFIED"
                confirmed_threshold = proposed_threshold
                audit.append(
                    f"ACTIVATION_VERIFIED: Calibrated threshold theta*={proposed_threshold:.3f} confirmed on all serving slots ({', '.join(verified_slots)})."
                )
            elif len(verified_slots) == 1:
                calibration_state = "ACTIVATION_PARTIAL"
                audit.append(
                    f"ACTIVATION_PARTIAL: Calibrated threshold theta*={proposed_threshold:.3f} confirmed only on {verified_slots[0]}."
                )
            elif failed_slots:
                calibration_state = "ACTIVATION_FAILED"
                audit.append(
                    f"ACTIVATION_FAILED: Serving slot failed activation: {'; '.join(failed_slots)}."
                )
            else:
                calibration_state = "CALIBRATION_COMPUTED"
                audit.append(
                    f"CALIBRATION_COMPUTED: Serving slots offline; proposed threshold theta*={proposed_threshold:.3f} recorded in state (activation unconfirmed)."
                )
        except Exception as exc:
            calibration_state = "CALIBRATION_COMPUTED"
            audit.append(
                f"CALIBRATION_COMPUTED: Serving runtime communication error: {exc}. Proposed threshold theta*={proposed_threshold:.3f} recorded."
            )

    # Persist proposed vs confirmed threshold in DB record
    db = SessionLocal()
    try:
        record = db.query(LifecycleStateRecordDB).first()
        if record:
            record.proposed_threshold = proposed_threshold
            record.threshold_state = calibration_state
            if calibration_state == "ACTIVATION_VERIFIED" and confirmed_threshold is not None:
                record.decision_threshold = confirmed_threshold
            db.commit()
    except Exception as db_exc:
        db.rollback()
        logger.warning("Failed to persist threshold state in DB: %s", db_exc)
    finally:
        db.close()

    cal_dict = res.to_dict()
    cal_dict["calibration_state"] = calibration_state
    cal_dict["proposed_threshold"] = proposed_threshold
    cal_dict["confirmed_active_threshold"] = confirmed_threshold

    return {
        "calibration_result": cal_dict,
        "calibration_state": calibration_state,
        "audit_trail": audit,
        "status": calibration_state.lower(),
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

    success = str(res.status).upper() == "SUCCESS"
    audit.append(
        f"A2 Adaptation {res.status} in {res.adaptation_duration_seconds}s for release {res.candidate_release_id}"
    )

    return {
        "candidate_release_id": candidate_id if success else None,
        "adaptation_result": res.to_dict(),
        "audit_trail": audit,
        "lifecycle_stage": "CANDIDATE_BUILT" if success else "ADAPTATION_FAILED",
        "status": "adapted" if success else "adaptation_deferred",
    }


def retrain_node(state: DARIState) -> dict[str, Any]:
    """Node 6 (A3): Resource-bounded subprocess retraining for candidate model."""
    audit = list(state.get("audit_trail", []))
    audit.append(f"[{datetime.now(UTC).isoformat()}] Entered RetrainNode (Action A3)")

    retrainer = SubprocessRetrainer(max_threads=2, timeout_seconds=180)
    candidate_id = f"R2-candidate-{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}"

    res = retrainer.retrain_candidate(candidate_release_id=candidate_id)
    success = str(res.status).upper() == "SUCCESS"
    audit.append(
        f"A3 Retraining {res.status} in {res.training_duration_seconds}s for release {res.candidate_release_id}"
    )

    return {
        "candidate_release_id": candidate_id if success else None,
        "retraining_result": res.to_dict(),
        "audit_trail": audit,
        "lifecycle_stage": "CANDIDATE_BUILT" if success else "RETRAIN_FAILED",
        "status": "retrained" if success else "retrain_failed",
    }


def evaluate_candidate_node(state: DARIState) -> dict[str, Any]:
    """Node: Pairwise candidate statistical evaluation and non-regression gate check."""
    from pathlib import Path

    import joblib
    import pandas as pd

    from schemas.lifecycle import EvaluationVerdict
    from swayamkavach.evaluation.compare import ModelComparator, compute_sha256

    audit = list(state.get("audit_trail", []))
    audit.append(f"[{datetime.now(UTC).isoformat()}] Entered EvaluateCandidateNode")

    cand_id = state.get("candidate_release_id")
    if not cand_id:
        audit.append("No candidate artifact built; skipping evaluation.")
        return {
            "audit_trail": audit,
            "lifecycle_stage": "EVALUATION_SKIPPED",
            "status": "evaluation_skipped",
        }

    backend_dir = Path(__file__).resolve().parent.parent.parent.parent
    champ_bundle = backend_dir / "releases" / "R1" / "pipeline.joblib"
    cand_bundle = backend_dir / "releases" / cand_id / "pipeline.joblib"
    val_csv = backend_dir / "data" / "processed" / "val.csv.gz"

    if not cand_bundle.exists() or not champ_bundle.exists() or not val_csv.exists():
        audit.append(f"Evaluation skipped: bundle or validation split missing for {cand_id}")
        return {
            "audit_trail": audit,
            "lifecycle_stage": "EVALUATION_INCONCLUSIVE",
            "status": "evaluation_inconclusive",
        }

    try:
        champ_pipeline = joblib.load(champ_bundle)
        cand_pipeline = joblib.load(cand_bundle)
        val_df = pd.read_csv(val_csv)

        comparator = ModelComparator()
        report = comparator.compare(
            champion_pipeline=champ_pipeline,
            candidate_pipeline=cand_pipeline,
            val_df=val_df,
            champion_release="R1",
            candidate_release=cand_id,
        )

        champ_sha = compute_sha256(champ_bundle)
        cand_sha = compute_sha256(cand_bundle)

        # Durably persist evaluation report
        db = SessionLocal()
        try:
            report_record = EvaluationReportRecordDB(
                report_id=report.report_id,
                champion_release="R1",
                candidate_release=cand_id,
                champion_sha256=champ_sha,
                candidate_sha256=cand_sha,
                dataset_version="val.csv.gz",
                evaluated_samples=report.evaluated_samples,
                verdict=report.verdict.value,
                p_value=float(report.p_value),
                statistically_significant=bool(report.statistically_significant),
                rejection_reasons=report.rejection_reasons,
                champion_metrics=report.champion_metrics,
                candidate_metrics=report.candidate_metrics,
                per_class_recall=report.per_class_recall_comparison,
                approval_hash=report.approval_hash,
                policy_version="dari-v1.0",
                created_at=datetime.now(UTC),
            )
            db.merge(report_record)
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.warning("Failed to persist EvaluationReportRecordDB in evaluate_candidate_node: %s", exc)
        finally:
            db.close()

        if report.verdict == EvaluationVerdict.PASS:
            stage = "AWAITING_APPROVAL"
            status = "evaluated_pass"
            audit.append(
                f"Candidate {cand_id} PASSED non-regression gates (report: {report.report_id}). Lifecycle stage: AWAITING_APPROVAL."
            )
        else:
            stage = "CANDIDATE_REJECTED"
            status = "evaluated_failed"
            audit.append(
                f"Candidate {cand_id} REJECTED by non-regression gates: {report.rejection_reasons}. Lifecycle stage: CANDIDATE_REJECTED."
            )

        return {
            "evaluation_report": report.to_dict(),
            "audit_trail": audit,
            "lifecycle_stage": stage,
            "status": status,
        }
    except Exception as exc:
        logger.error("Error evaluating candidate: %s", exc)
        audit.append(f"Candidate evaluation error: {exc}")
        return {
            "audit_trail": audit,
            "lifecycle_stage": "EVALUATION_FAILED",
            "status": "evaluation_failed",
        }


def candidate_build_router(state: DARIState) -> str:
    """Route candidate to evaluation if successfully built, or skip to audit if build failed."""
    stage = state.get("lifecycle_stage")
    if stage == "CANDIDATE_BUILT" and state.get("candidate_release_id"):
        return "evaluate_candidate"
    return "audit"


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
    workflow.add_node("evaluate_candidate", evaluate_candidate_node)
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

    # Conditional routing after Candidate Build (A2/A3)
    workflow.add_conditional_edges(
        "adapt",
        candidate_build_router,
        {
            "evaluate_candidate": "evaluate_candidate",
            "audit": "audit",
        },
    )
    workflow.add_conditional_edges(
        "retrain",
        candidate_build_router,
        {
            "evaluate_candidate": "evaluate_candidate",
            "audit": "audit",
        },
    )

    # Terminal convergence
    workflow.add_edge("calibrate", "audit")
    workflow.add_edge("evaluate_candidate", "audit")
    workflow.add_edge("audit", END)

    return workflow.compile()

