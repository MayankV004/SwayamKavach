"""Unit tests for Phase 6 Candidate Evaluation, statistical tests, safety gates, and approval flow."""

from datetime import UTC, datetime
from unittest.mock import MagicMock

import numpy as np
import pandas as pd
from starlette.testclient import TestClient

from schemas.lifecycle import EvaluationVerdict
from swayamkavach.api.main import app
from swayamkavach.db.session import init_db
from swayamkavach.evaluation.compare import ModelComparator


def test_mcnemar_statistical_significance_calculation():
    """Verify paired McNemar test accurately identifies significance."""
    comparator = ModelComparator(significance_alpha=0.05)

    y_true = np.ones(100, dtype=int)
    # Identical predictions -> p = 1.0
    preds_a = np.ones(100, dtype=int)
    preds_b = np.ones(100, dtype=int)
    p_identical = comparator.compute_mcnemar_p_value(y_true, preds_a, preds_b)
    assert p_identical == 1.0

    # Statistically significant discordant predictions:
    # Model A is correct on 80 samples, Model B is correct on 50 samples
    preds_champ = np.array([1] * 80 + [0] * 20)
    preds_cand = np.array([1] * 50 + [0] * 50)
    p_discordant = comparator.compute_mcnemar_p_value(y_true, preds_champ, preds_cand)
    assert p_discordant < 0.05


def test_candidate_evaluation_pass():
    """Verify candidate meeting all non-regression gates and statistical bounds receives PASS."""
    n_samples = 200
    df = pd.DataFrame({
        "duration": np.random.exponential(1.0, n_samples),
        "src_bytes": np.random.gamma(2.0, 100.0, n_samples),
        "label": np.concatenate([np.zeros(100, dtype=int), np.ones(100, dtype=int)]),
        "type": ["normal"] * 100 + ["ddos"] * 50 + ["backdoor"] * 50,
    })

    # Champion model mock: 97% recall (misses 3 attacks), 1% FPR
    champ_mock = MagicMock()
    champ_probs = np.zeros((n_samples, 2))
    champ_probs[:100, 1] = 0.01   # normal low score
    champ_probs[100:103, 1] = 0.01  # 3 missed attacks
    champ_probs[103:, 1] = 0.98   # detected attacks
    champ_mock.predict_proba.return_value = champ_probs

    # Candidate model mock: 100% recall, 0.8% FPR (superior performance)
    cand_mock = MagicMock()
    cand_probs = np.zeros((n_samples, 2))
    cand_probs[:100, 1] = 0.008
    cand_probs[100:, 1] = 0.99
    cand_mock.predict_proba.return_value = cand_probs


    comparator = ModelComparator(max_fpr=0.015, min_overall_recall=0.98)
    report = comparator.compare(
        champion_pipeline=champ_mock,
        candidate_pipeline=cand_mock,
        val_df=df,
        champion_release="R1",
        candidate_release="R2-candidate",
    )

    assert report.verdict == EvaluationVerdict.PASS
    assert len(report.rejection_reasons) == 0
    assert report.candidate_metrics["recall"] >= 0.98
    assert report.candidate_metrics["fpr"] <= 0.015


def test_candidate_evaluation_fails_on_critical_recall_drop():
    """DARI invariant: Regression on any critical attack class (> 0.5%) MUST yield FAIL."""
    n_samples = 200
    df = pd.DataFrame({
        "duration": np.random.exponential(1.0, n_samples),
        "src_bytes": np.random.gamma(2.0, 100.0, n_samples),
        "label": np.concatenate([np.zeros(100, dtype=int), np.ones(100, dtype=int)]),
        "type": ["normal"] * 100 + ["ddos"] * 50 + ["backdoor"] * 50,
    })

    # Champion mock: 100% recall on ddos and backdoor
    champ_mock = MagicMock()
    champ_probs = np.zeros((n_samples, 2))
    champ_probs[:100, 1] = 0.01
    champ_probs[100:, 1] = 0.95
    champ_mock.predict_proba.return_value = champ_probs

    # Candidate mock: high overall metrics, but backdoor dropped to 80% (breach!)
    cand_mock = MagicMock()
    cand_probs = np.zeros((n_samples, 2))
    cand_probs[:100, 1] = 0.01
    cand_probs[100:150, 1] = 0.99  # ddos
    cand_probs[150:, 1] = 0.10     # backdoor dropped!
    cand_mock.predict_proba.return_value = cand_probs

    comparator = ModelComparator(max_critical_recall_drop=0.005)
    report = comparator.compare(
        champion_pipeline=champ_mock,
        candidate_pipeline=cand_mock,
        val_df=df,
    )

    assert report.verdict == EvaluationVerdict.FAIL
    assert any("Gate Critical Regression (backdoor)" in reason for reason in report.rejection_reasons)


def test_candidate_evaluation_fails_on_fpr_inflation():
    """DARI invariant: Candidate inflating False Positive Rate beyond threshold MUST yield FAIL."""
    n_samples = 200
    df = pd.DataFrame({
        "duration": np.random.exponential(1.0, n_samples),
        "src_bytes": np.random.gamma(2.0, 100.0, n_samples),
        "label": np.concatenate([np.zeros(100, dtype=int), np.ones(100, dtype=int)]),
        "type": ["normal"] * 100 + ["ddos"] * 100,
    })

    # Champion mock: 0.5% FPR
    champ_mock = MagicMock()
    champ_probs = np.zeros((n_samples, 2))
    champ_probs[:100, 1] = 0.005
    champ_probs[100:, 1] = 0.98
    champ_mock.predict_proba.return_value = champ_probs

    # Candidate mock: 5% FPR (5 false positive alarms among 100 normals, exceeding 1.5% limit!)
    cand_mock = MagicMock()
    cand_probs = np.zeros((n_samples, 2))
    cand_probs[:5, 1] = 0.85   # 5 false positives above threshold 0.42
    cand_probs[5:100, 1] = 0.01
    cand_probs[100:, 1] = 0.99
    cand_mock.predict_proba.return_value = cand_probs


    comparator = ModelComparator(max_fpr=0.015)
    report = comparator.compare(
        champion_pipeline=champ_mock,
        candidate_pipeline=cand_mock,
        val_df=df,
    )

    assert report.verdict == EvaluationVerdict.FAIL
    assert any("Gate FPR Breach" in reason for reason in report.rejection_reasons)


def test_candidate_evaluation_inconclusive_on_small_samples():
    """DARI invariant: Inconclusive evaluation on small sample sizes (N < 100)."""
    n_samples = 50  # Small sample
    df = pd.DataFrame({
        "duration": np.random.exponential(1.0, n_samples),
        "src_bytes": np.random.gamma(2.0, 100.0, n_samples),
        "label": np.concatenate([np.zeros(25, dtype=int), np.ones(25, dtype=int)]),
        "type": ["normal"] * 25 + ["ddos"] * 25,
    })

    model_mock = MagicMock()
    probs = np.zeros((n_samples, 2))
    probs[:25, 1] = 0.01
    probs[25:, 1] = 0.99
    model_mock.predict_proba.return_value = probs

    comparator = ModelComparator(min_samples_for_pass=100)
    report = comparator.compare(
        champion_pipeline=model_mock,
        candidate_pipeline=model_mock,
        val_df=df,
    )

    assert report.verdict == EvaluationVerdict.INCONCLUSIVE
    assert any("Insufficient evaluation samples" in reason for reason in report.rejection_reasons)


def test_evaluation_approval_api_security_gates():
    """Test API approval route rejects FAIL/INCONCLUSIVE candidates and stages PASS candidates."""
    init_db()
    client = TestClient(app)

    from swayamkavach.evaluation.compare import EvaluationReport

    # 1. Attempting approval when latest report is FAIL must return HTTP 403
    fail_report = EvaluationReport(
        report_id="EVAL_R1_R2_FAIL_001",
        champion_release="R1",
        candidate_release="R2-candidate",
        verdict=EvaluationVerdict.FAIL,
        p_value=0.01,
        statistically_significant=True,
        rejection_reasons=["Gate Critical Regression (backdoor)"],
        champion_metrics={"recall": 0.99, "fpr": 0.005},
        candidate_metrics={"recall": 0.92, "fpr": 0.005},
        per_class_recall_comparison={},
        evaluated_samples=500,
        approval_hash="hash_fail_123",
        created_at=datetime.now(UTC).isoformat(),
    )
    from pathlib import Path

    from swayamkavach.db.models import EvaluationReportRecordDB
    from swayamkavach.db.session import SessionLocal
    from swayamkavach.evaluation.compare import compute_sha256

    backend_dir = Path(__file__).resolve().parent.parent.parent
    r2_bundle = backend_dir / "releases" / "R2" / "pipeline.joblib"
    r2_sha = compute_sha256(r2_bundle) if r2_bundle.exists() else "placeholder_sha256"

    db = SessionLocal()
    try:
        db.merge(
            EvaluationReportRecordDB(
                report_id=fail_report.report_id,
                champion_release=fail_report.champion_release,
                candidate_release=fail_report.candidate_release,
                champion_sha256="champ_sha",
                candidate_sha256="cand_sha",
                dataset_version="val.csv.gz",
                evaluated_samples=fail_report.evaluated_samples,
                verdict=fail_report.verdict.value,
                p_value=fail_report.p_value,
                statistically_significant=fail_report.statistically_significant,
                rejection_reasons=fail_report.rejection_reasons,
                champion_metrics=fail_report.champion_metrics,
                candidate_metrics=fail_report.candidate_metrics,
                per_class_recall=fail_report.per_class_recall_comparison,
                approval_hash=fail_report.approval_hash,
            )
        )
        db.commit()
    finally:
        db.close()

    # Unauthenticated request must return HTTP 401
    resp_unauth = client.post(
        "/api/v1/evaluations/approve",
        json={
            "report_id": "EVAL_R1_R2_FAIL_001",
            "approval_hash": "hash_fail_123",
            "operator_id": "auditor",
        },
    )
    assert resp_unauth.status_code == 401

    auth_headers = {"X-API-Key": "swayamkavach-control-plane-secret-key-v1"}

    resp_fail = client.post(
        "/api/v1/evaluations/approve",
        json={
            "report_id": "EVAL_R1_R2_FAIL_001",
            "approval_hash": "hash_fail_123",
            "operator_id": "auditor",
        },
        headers=auth_headers,
    )
    assert resp_fail.status_code == 403
    assert "Cannot approve candidate with verdict FAIL" in resp_fail.json()["detail"]

    # 2. Approving PASS report with existing artifact bundle stages candidate to Slot B with 5% canary weight
    pass_report = EvaluationReport(
        report_id="EVAL_R1_R2_PASS_001",
        champion_release="R1",
        candidate_release="R2",
        verdict=EvaluationVerdict.PASS,
        p_value=0.02,
        statistically_significant=True,
        rejection_reasons=[],
        champion_metrics={"recall": 0.99, "fpr": 0.008},
        candidate_metrics={"recall": 0.995, "fpr": 0.006},
        per_class_recall_comparison={},
        evaluated_samples=500,
        approval_hash="hash_pass_456",
        created_at=datetime.now(UTC).isoformat(),
    )
    db = SessionLocal()
    try:
        from swayamkavach.db.models import LifecycleStateRecordDB

        lc = db.query(LifecycleStateRecordDB).first()
        if not lc:
            lc = LifecycleStateRecordDB(id=1, champion_release="R1", active_slot="A", canary_weight=0.0)
            db.add(lc)
        else:
            lc.active_slot = "A"
            lc.champion_release = "R1"
            lc.candidate_release = None
            lc.canary_weight = 0.0

        db.merge(
            EvaluationReportRecordDB(
                report_id=pass_report.report_id,
                champion_release=pass_report.champion_release,
                candidate_release=pass_report.candidate_release,
                champion_sha256="champ_sha",
                candidate_sha256=r2_sha,
                dataset_version="val.csv.gz",
                evaluated_samples=pass_report.evaluated_samples,
                verdict=pass_report.verdict.value,
                p_value=pass_report.p_value,
                statistically_significant=pass_report.statistically_significant,
                rejection_reasons=pass_report.rejection_reasons,
                champion_metrics=pass_report.champion_metrics,
                candidate_metrics=pass_report.candidate_metrics,
                per_class_recall=pass_report.per_class_recall_comparison,
                approval_hash=pass_report.approval_hash,
            )
        )
        db.commit()
    finally:
        db.close()

    resp_pass = client.post(
        "/api/v1/evaluations/approve",
        json={
            "report_id": "EVAL_R1_R2_PASS_001",
            "approval_hash": "hash_pass_456",
            "operator_id": "senior_engineer",
        },
        headers=auth_headers,
    )
    assert resp_pass.status_code == 200
    data = resp_pass.json()
    assert data["status"] == "approved"
    assert data["candidate_release"] == "R2"
    assert data["candidate_slot"] == "B"
    assert data["canary_weight"] == 0.05
    assert "approval_signature" in data


def test_candidate_approval_rejects_missing_bundle():
    """Verify approval fails closed with HTTP 400 when artifact bundle or manifest is missing."""
    from starlette.testclient import TestClient

    from swayamkavach.api.main import app
    from swayamkavach.db.models import EvaluationReportRecordDB
    from swayamkavach.db.session import SessionLocal
    from swayamkavach.evaluation.compare import EvaluationReport

    client = TestClient(app)
    missing_report = EvaluationReport(
        report_id="EVAL_R1_NONEXISTENT_PASS_001",
        champion_release="R1",
        candidate_release="NON_EXISTENT_RELEASE_999",
        verdict=EvaluationVerdict.PASS,
        p_value=0.01,
        statistically_significant=True,
        rejection_reasons=[],
        champion_metrics={"recall": 0.99, "fpr": 0.008},
        candidate_metrics={"recall": 0.995, "fpr": 0.006},
        per_class_recall_comparison={},
        evaluated_samples=500,
        approval_hash="hash_missing_789",
        created_at=datetime.now(UTC).isoformat(),
    )
    db = SessionLocal()
    try:
        db.merge(
            EvaluationReportRecordDB(
                report_id=missing_report.report_id,
                champion_release=missing_report.champion_release,
                candidate_release=missing_report.candidate_release,
                champion_sha256="champ_sha",
                candidate_sha256="missing_sha",
                dataset_version="val.csv.gz",
                evaluated_samples=missing_report.evaluated_samples,
                verdict=missing_report.verdict.value,
                p_value=missing_report.p_value,
                statistically_significant=missing_report.statistically_significant,
                rejection_reasons=missing_report.rejection_reasons,
                champion_metrics=missing_report.champion_metrics,
                candidate_metrics=missing_report.candidate_metrics,
                per_class_recall=missing_report.per_class_recall_comparison,
                approval_hash=missing_report.approval_hash,
            )
        )
        db.commit()
    finally:
        db.close()

    auth_headers = {"X-API-Key": "swayamkavach-control-plane-secret-key-v1"}
    resp = client.post(
        "/api/v1/evaluations/approve",
        json={
            "report_id": "EVAL_R1_NONEXISTENT_PASS_001",
            "approval_hash": "hash_missing_789",
            "operator_id": "auditor",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 400
    assert "not found" in resp.json()["detail"]
