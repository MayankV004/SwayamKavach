"""Unit tests for DARI Decision Solver, Level A1 Calibrator, and LangGraph workflow."""

import numpy as np

from schemas.lifecycle import DamageFingerprint, RepairAction
from swayamkavach.agents.graph import build_dari_graph
from swayamkavach.dari.calibrator import ThresholdCalibrator
from swayamkavach.dari.selector import DARISolver


def test_dari_solver_nominal_traffic_a0():
    """Verify that nominal operational fingerprint results in A0 (continue monitoring)."""
    fp = DamageFingerprint(
        D_X=0.03,
        D_Y=0.005,
        D_B=0.04,
        Q=0.99,
        L=0.95,
        S=1000,
        R=1,
    )
    solver = DARISolver()
    res = solver.select_action(fp)

    assert res.chosen_action == RepairAction.A0
    assert RepairAction.A0 in res.feasible_actions


def test_dari_solver_boundary_damage_triggers_a1():
    """Verify that decision boundary ambiguity (high D_B) triggers A1 threshold calibration."""
    fp = DamageFingerprint(
        D_X=0.08,
        D_Y=0.01,
        D_B=0.52,  # Elevated boundary ambiguity
        Q=0.98,
        L=0.90,
        S=1000,
        R=1,
    )
    solver = DARISolver()
    res = solver.select_action(fp)

    assert res.chosen_action == RepairAction.A1
    assert res.utility_scores["A1"] > res.utility_scores["A0"]


def test_dari_solver_data_quality_breach_forbids_retrain():
    """DARI invariant: Low data quality (Q < Q_min) MUST filter out A2 and A3 as infeasible."""
    fp = DamageFingerprint(
        D_X=0.65,  # High drift
        D_Y=0.30,  # High degradation
        D_B=0.20,
        Q=0.50,  # CRITICAL QUALITY BREACH (Q < 0.70)
        L=0.95,
        S=2000,
        R=3,
    )
    solver = DARISolver(q_min=0.70)
    feasible, rejections = solver.filter_feasibility(fp)

    assert RepairAction.A2 not in feasible
    assert RepairAction.A3 not in feasible
    assert "A3" in rejections
    assert "Data quality Q=" in rejections["A3"]

    # Even with high damage, solver cannot choose A2 or A3
    res = solver.select_action(fp)
    assert res.chosen_action in [RepairAction.A0, RepairAction.A1]
    assert res.chosen_action != RepairAction.A3


def test_dari_solver_unlabelled_stream_forbids_retrain():
    """DARI invariant: Unlabelled stream (D_Y is None, L=0) strictly forbids A2 and A3."""
    fp = DamageFingerprint(
        D_X=0.60,
        D_Y=None,  # Labels absent
        D_B=0.15,
        Q=0.99,
        L=0.0,
        S=2000,
        R=3,
    )
    solver = DARISolver()
    feasible, rejections = solver.filter_feasibility(fp)

    assert RepairAction.A2 not in feasible
    assert RepairAction.A3 not in feasible
    assert "A3" in rejections
    assert "unlabelled" in rejections["A3"].lower()


def test_dari_solver_transient_spike_prevents_a3():
    """DARI invariant: Transient drift (R=1 < R_min) must not trigger full retraining."""
    fp = DamageFingerprint(
        D_X=0.55,
        D_Y=0.20,
        D_B=0.25,
        Q=0.98,
        L=0.95,
        S=1500,
        R=1,  # Transient (first window)
    )
    solver = DARISolver(r_min_for_a3=2)
    feasible, rejections = solver.filter_feasibility(fp)

    assert RepairAction.A3 not in feasible
    assert "Transient shift" in rejections["A3"]


def test_dari_solver_moderate_localized_damage_selects_a2():
    """Verify that moderate localized covariate drift (D_X=0.32 < 0.40) selects A2."""
    fp = DamageFingerprint(
        D_X=0.32,
        D_Y=0.04,
        D_B=0.10,
        Q=0.98,
        L=0.95,
        S=1000,
        R=1,
    )
    solver = DARISolver()
    res = solver.select_action(fp)

    assert RepairAction.A2 in res.feasible_actions
    assert res.chosen_action == RepairAction.A2


def test_dari_solver_persistent_severe_damage_triggers_a3():
    """Verify that severe damage with high persistence, quality, and labels selects A3."""

    fp = DamageFingerprint(
        D_X=0.60,
        D_Y=0.25,
        D_B=0.30,
        Q=0.98,
        L=0.95,
        S=2000,
        R=3,  # Persistent
    )
    solver = DARISolver(r_min_for_a3=2)
    res = solver.select_action(fp)

    assert RepairAction.A3 in res.feasible_actions
    assert res.chosen_action == RepairAction.A3


def test_threshold_calibrator_optimization():
    """Verify Level A1 calibrator finds optimal theta* meeting recall >= 0.98 and FPR <= 0.02."""
    np.random.seed(42)
    n = 500

    # Synthetic normal scores (centered around 0.15)
    normal_scores = np.random.beta(2, 8, n)
    # Synthetic attack scores (centered around 0.85)
    attack_scores = np.random.beta(8, 2, n)

    scores = np.concatenate([normal_scores, attack_scores])
    y_true = np.concatenate([np.zeros(n, dtype=int), np.ones(n, dtype=int)])

    calibrator = ThresholdCalibrator(min_recall=0.98, max_fpr=0.02)
    res = calibrator.calibrate(y_true, scores, current_threshold=0.50)

    assert res.meets_constraints is True
    assert res.recall >= 0.98
    assert res.fpr <= 0.02
    assert 0.30 <= res.new_threshold <= 0.60


def test_langgraph_dari_pipeline_execution():
    """Verify end-to-end execution of the LangGraph state machine."""
    graph = build_dari_graph()

    # Provide initial synthetic state with boundary ambiguity to test A1 pathway
    initial_state = {
        "window_id": "test_graph_w0",
        "sample_count": 100,
        "features_records": [{"duration": 1.0, "src_bytes": 100}] * 100,
        "scores": [0.41] * 100,
        "y_true": [0] * 50 + [1] * 50,
        "fingerprint": {
            "D_X": 0.05,
            "D_Y": 0.01,
            "D_B": 0.55,
            "Q": 0.98,
            "L": 0.95,
            "S": 100,
            "R": 1,
        },
        "audit_trail": [],
    }

    final_state = graph.invoke(initial_state)

    assert final_state["status"] == "completed"
    assert final_state["chosen_action"] == "A1"
    assert final_state["calibration_result"] is not None
    assert any("Entered CalibrateNode" in msg for msg in final_state["audit_trail"])
    assert any("Entered AuditNode" in msg for msg in final_state["audit_trail"])


def test_subprocess_retrainer_candidate_generation():
    """Verify SubprocessRetrainer generates valid candidate artifacts with thread bounds."""
    import shutil
    from pathlib import Path

    from swayamkavach.dari.retrainer import SubprocessRetrainer

    retrainer = SubprocessRetrainer(max_threads=2, timeout_seconds=120)
    cand_id = "test_R_cand_tmp"
    res = retrainer.retrain_candidate(candidate_release_id=cand_id)

    assert res.status == "success"
    assert res.candidate_release_id == cand_id
    assert "release_id" in res.manifest

    # Cleanup test candidate directory
    cand_dir = Path(res.artifact_dir)
    if cand_dir.exists():
        shutil.rmtree(cand_dir, ignore_errors=True)

