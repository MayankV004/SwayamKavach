"""Integration tests for Phase 8: Replay Experiments and Baseline Benchmarks."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from schemas.lifecycle import RepairAction
from swayamkavach.api.main import app
from swayamkavach.db.models import Base, LifecycleStateRecordDB
from swayamkavach.experiments.benchmark import BaselineBenchmarkHarness, PolicyType
from swayamkavach.experiments.scenarios import ReplayScenarioRunner, ScenarioType


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine)
    session = session_factory()
    # Seed initial R1 champion
    init_state = LifecycleStateRecordDB(
        id=1,
        champion_release="R1",
        active_slot="A",
        candidate_release=None,
        candidate_slot=None,
        canary_weight=0.0,
        last_action="INIT_R1",
    )
    session.add(init_state)
    session.commit()
    yield session
    session.close()


def test_scenario_nominal():
    runner = ReplayScenarioRunner()
    result = runner.run_nominal_scenario()

    assert result.scenario == ScenarioType.NOMINAL
    assert result.chosen_action == RepairAction.A0
    assert result.deployment_action == "NO_OP_MONITORING"
    assert result.safety_invariants_preserved is True
    assert result.details["compute_consumed_seconds"] == 0.0


def test_scenario_boundary_shift():
    runner = ReplayScenarioRunner()
    result = runner.run_boundary_shift_scenario()

    assert result.scenario == ScenarioType.BOUNDARY_SHIFT
    assert result.chosen_action == RepairAction.A1
    assert "RECALIBRATED_THRESHOLD" in result.deployment_action
    assert result.safety_invariants_preserved is True
    assert result.details["calibrated_recall"] >= 0.98
    assert result.details["calibrated_fpr"] <= 0.02


def test_scenario_localized_cluster():
    runner = ReplayScenarioRunner()
    result = runner.run_localized_cluster_scenario()

    assert result.scenario == ScenarioType.LOCALIZED_CLUSTER
    assert result.chosen_action == RepairAction.A2
    assert result.safety_invariants_preserved is True


def test_scenario_severe_attack_and_canary_promotion(test_db):
    runner = ReplayScenarioRunner()
    result = runner.run_severe_attack_scenario(db=test_db)

    assert result.scenario == ScenarioType.SEVERE_ATTACK
    assert result.chosen_action == RepairAction.A3
    assert result.evaluation_verdict == "PASS"
    assert result.safety_invariants_preserved is True
    assert "PROMOTED_CHAMPION_R2" in result.deployment_action

    # Verify DB state has candidate promoted to champion on Slot B
    rec = test_db.query(LifecycleStateRecordDB).first()
    assert rec.champion_release == "R2"
    assert rec.active_slot == "B"
    assert rec.canary_weight == 0.0
    assert rec.candidate_release is None


def test_negative_scenario_faulty_candidate_rejection():
    runner = ReplayScenarioRunner()
    result = runner.run_faulty_candidate_rejection_scenario()

    assert result.scenario == ScenarioType.FAULTY_CANDIDATE_REJECTION
    assert result.evaluation_verdict == "FAIL"
    assert result.deployment_action == "REJECTED_AT_SAFETY_GATE"
    assert result.safety_invariants_preserved is True
    assert any("backdoor" in r for r in result.details["rejection_reasons"])


def test_negative_scenario_canary_watchdog_rollback(test_db):
    runner = ReplayScenarioRunner()
    result = runner.run_canary_watchdog_rollback_scenario(db=test_db)

    assert result.scenario == ScenarioType.CANARY_WATCHDOG_ROLLBACK
    assert result.deployment_action == "WARM_ROLLBACK_COMPLETED"
    assert result.safety_invariants_preserved is True

    # Check Slot A retains 100% traffic
    rec = test_db.query(LifecycleStateRecordDB).first()
    assert rec.active_slot == "A"
    assert rec.canary_weight == 0.0
    assert rec.candidate_release is None


def test_negative_scenario_corrupted_data_safety():
    runner = ReplayScenarioRunner()
    result = runner.run_corrupted_data_rejection_scenario()

    assert result.scenario == ScenarioType.CORRUPTED_DATA_REJECTION
    assert result.chosen_action in (RepairAction.A0, RepairAction.A1)
    assert result.chosen_action != RepairAction.A3
    assert result.safety_invariants_preserved is True
    assert "Q" in result.details["rejection_reasons"].get("A3", "")


def test_negative_scenario_unlabelled_stream_safety():
    runner = ReplayScenarioRunner()
    result = runner.run_unlabelled_stream_scenario()

    assert result.scenario == ScenarioType.UNLABELLED_STREAM_SAFETY
    assert result.chosen_action in (RepairAction.A0, RepairAction.A1)
    assert result.chosen_action != RepairAction.A3
    assert (
        "unlabelled" in result.details["rejection_reasons"].get("A3", "").lower()
        or "l" in result.details["rejection_reasons"].get("A3", "").lower()
    )


def test_baseline_benchmark_comparison_matrix():
    harness = BaselineBenchmarkHarness()
    report = harness.run_benchmark(n_windows=10)

    assert report.total_windows_evaluated == 10
    assert report.total_events_evaluated == 2000

    results = report.results
    assert PolicyType.DARI.value in results
    assert PolicyType.STATIC_CHAMPION.value in results
    assert PolicyType.PERIODIC_RETRAINING.value in results
    assert PolicyType.RETRAIN_ALL.value in results

    dari = results[PolicyType.DARI.value]
    static_p = results[PolicyType.STATIC_CHAMPION.value]
    periodic = results[PolicyType.PERIODIC_RETRAINING.value]
    retrain_all = results[PolicyType.RETRAIN_ALL.value]

    # DARI preserves high attack recall
    assert dari.cumulative_recall >= 0.95

    # Static Champion suffers under drift
    assert static_p.cumulative_recall < dari.cumulative_recall

    # DARI has 0% unnecessary retraining rate
    assert dari.unnecessary_retrain_rate == 0.0

    # Periodic and Retrain-All suffer from high unnecessary retraining rates
    assert periodic.unnecessary_retrain_rate >= 0.20
    assert retrain_all.unnecessary_retrain_rate >= 0.20

    # DARI achieves significant compute savings vs Periodic Retraining (> 50%)
    assert dari.compute_savings_pct >= 50.0

    # DARI consumes significantly fewer delayed labels than Periodic Retraining
    assert dari.label_savings_pct >= 40.0


def test_experiments_api_routes():
    client = TestClient(app)

    # 1. Run nominal scenario via API
    resp = client.post("/api/v1/experiments/scenarios/run", json={"scenario": "nominal"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["scenario"] == "nominal"
    assert data["chosen_action"] == "A0"
    assert data["safety_invariants_preserved"] is True

    # 2. Run faulty candidate rejection via API
    resp = client.post("/api/v1/experiments/scenarios/run", json={"scenario": "faulty_candidate_rejection"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["scenario"] == "faulty_candidate_rejection"
    assert data["evaluation_verdict"] == "FAIL"
    assert data["deployment_action"] == "REJECTED_AT_SAFETY_GATE"

    # 3. Run benchmark report via API
    resp = client.get("/api/v1/experiments/benchmark?n_windows=5")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_windows_evaluated"] == 5
    assert "dari" in data["results"]
    assert "static_champion" in data["results"]
    assert data["results"]["dari"]["unnecessary_retrain_rate"] == 0.0

    # 4. Fetch baseline model comparison benchmarks via API
    models_resp = client.get("/api/v1/experiments/models/benchmark")
    assert models_resp.status_code == 200
    models_data = models_resp.json()
    assert models_data["release_id"] == "R1"
    assert "model_comparison" in models_data
    comparison = models_data["model_comparison"]
    assert "DecisionTree" in comparison
    assert "HistGradientBoosting" in comparison
    assert "LightGBM" in comparison
    # Verify confusion matrix keys and calibrated metrics exist
    for m in ["DecisionTree", "HistGradientBoosting", "LightGBM"]:
        cal_metrics = comparison[m]["val_metrics_calibrated"]
        assert "accuracy" in cal_metrics
        assert "f1" in cal_metrics
        assert "tp" in cal_metrics and "fp" in cal_metrics and "tn" in cal_metrics and "fn" in cal_metrics

