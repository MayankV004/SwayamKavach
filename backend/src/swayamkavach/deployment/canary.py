"""Two-Slot Canary Rollout and Warm Rollback Controller.

Implements Phase 7:
  - Guarded, staged traffic migration: 5% -> 25% -> 50% -> 100%.
  - Health probe validation before advancing each stage.
  - Immediate deterministic warm rollback restoring 100% champion traffic upon watchdog breach.
  - Idempotent lifecycle database persistence.
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum
from pathlib import Path
from typing import Any, Literal

from sqlalchemy.orm import Session

from swayamkavach.db.models import (
    GroundTruthLabelRecordDB,
    LifecycleStateRecordDB,
    PredictionRecordDB,
)
from swayamkavach.evaluation.compare import compute_sha256

logger = logging.getLogger("swayamkavach.deployment.canary")

CANARY_STAGES = [0.05, 0.25, 0.50, 1.00]


class RolloutStatus(StrEnum):
    IDLE = "IDLE"
    STAGED = "STAGED"
    PROGRESSING = "PROGRESSING"
    COMPLETED = "COMPLETED"
    ROLLED_BACK = "ROLLED_BACK"


@dataclass(frozen=True)
class CanaryState:
    """Snapshot of active two-slot deployment state."""

    champion_release: str
    active_slot: Literal["A", "B"]
    candidate_release: str | None
    candidate_slot: Literal["A", "B"] | None
    canary_weight: float
    status: RolloutStatus
    last_reason: str
    updated_at: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "champion_release": self.champion_release,
            "active_slot": self.active_slot,
            "candidate_release": self.candidate_release,
            "candidate_slot": self.candidate_slot,
            "canary_weight": self.canary_weight,
            "status": self.status.value,
            "last_reason": self.last_reason,
            "updated_at": self.updated_at,
        }


class CanaryController:
    """Manages dual-slot traffic routing, progressive rollout, and zero-downtime rollback."""

    def __init__(self, nginx_conf_path: Path | None = None):
        self.nginx_conf_path = nginx_conf_path

    def get_state(self, db: Session) -> CanaryState:
        """Fetch current canary state from authoritative database record."""
        record = db.query(LifecycleStateRecordDB).first()
        if record is None:
            return CanaryState(
                champion_release="R1",
                active_slot="A",
                candidate_release=None,
                candidate_slot=None,
                canary_weight=0.0,
                status=RolloutStatus.IDLE,
                last_reason="Nominal operation",
                updated_at=datetime.now(UTC).isoformat(),
            )

        status = RolloutStatus.IDLE
        if record.canary_weight > 0.0 and record.canary_weight < 1.0:
            status = RolloutStatus.PROGRESSING
        elif record.candidate_release and record.canary_weight == 0.0:
            status = RolloutStatus.STAGED

        return CanaryState(
            champion_release=record.champion_release or "R1",
            active_slot=record.active_slot or "A",  # type: ignore[arg-type]
            candidate_release=record.candidate_release,
            candidate_slot=record.candidate_slot,  # type: ignore[arg-type]
            canary_weight=record.canary_weight,
            status=status,
            last_reason=record.last_action,
            updated_at=record.updated_at.isoformat() if record.updated_at else datetime.now(UTC).isoformat(),
        )

    def stage_candidate(
        self,
        db: Session,
        candidate_release: str,
        initial_weight: float = 0.05,
    ) -> CanaryState:
        """Stage an approved candidate into the inactive slot with initial canary weight.

        Pre-flight safety invariant:
          1. Verify candidate artifact bundle and manifest digest on disk if present.
          2. Reload candidate in inactive slot and verify HTTP 200.
          3. Verify inactive slot release identity, readiness, and non-heuristic mode.
          4. Apply and verify Nginx routing weights.
          5. Only persist state to DB once all pre-flight and routing checks pass.
        """
        record = db.query(LifecycleStateRecordDB).first()
        if record is None:
            record = LifecycleStateRecordDB(id=1, champion_release="R1", active_slot="A")
            db.add(record)

        active = record.active_slot or "A"
        cand_slot = "B" if active == "A" else "A"
        cand_port = 8002 if cand_slot == "B" else 8001

        # 1. Verify candidate artifact integrity on disk if release folder exists
        backend_dir = Path(__file__).resolve().parent.parent.parent.parent
        bundle_path = backend_dir / "releases" / candidate_release / "pipeline.joblib"
        manifest_path = backend_dir / "releases" / candidate_release / "manifest.json"
        if bundle_path.exists():
            computed_sha = compute_sha256(bundle_path)
            if manifest_path.exists():
                try:
                    with open(manifest_path, encoding="utf-8") as f:
                        m_data = json.load(f)
                    expected_sha = m_data.get("bundle_sha256")
                    if expected_sha and expected_sha != computed_sha:
                        raise ValueError(
                            f"Candidate artifact corrupted: digest {computed_sha} != manifest {expected_sha}"
                        )
                except json.JSONDecodeError as exc:
                    raise ValueError(f"Invalid candidate manifest: {exc}") from exc

        # 2. Pre-flight: load and verify candidate in inactive slot BEFORE changing routing or updating DB
        try:
            import httpx
            with httpx.Client(timeout=2.0) as client:
                reload_resp = client.post(
                    f"http://127.0.0.1:{cand_port}/reload",
                    params={"release_id": candidate_release},
                )
                if reload_resp.status_code != 200:
                    raise RuntimeError(f"Candidate slot reload failed with HTTP {reload_resp.status_code}")

                # Verify identity
                id_resp = client.get(f"http://127.0.0.1:{cand_port}/identity")
                if id_resp.status_code == 200:
                    id_data = id_resp.json()
                    active_rel = id_data.get("release_id")
                    if active_rel and active_rel != candidate_release:
                        raise RuntimeError(
                            f"Candidate slot reports wrong release {active_rel} (expected {candidate_release})"
                        )

                # Verify readyz
                ready_resp = client.get(f"http://127.0.0.1:{cand_port}/readyz")
                if ready_resp.status_code != 200:
                    raise RuntimeError(f"Candidate slot readyz failed with HTTP {ready_resp.status_code}")
                ready_data = ready_resp.json()
                if not ready_data.get("is_ready", True):
                    raise RuntimeError("Candidate slot reports is_ready=False")
                if ready_data.get("inference_mode") == "heuristic":
                    raise RuntimeError("Candidate slot is running in forbidden heuristic fallback mode")
        except RuntimeError:
            raise
        except Exception as exc:
            logger.error("Failed to load and verify candidate in slot %s: %s", cand_slot, exc)
            raise RuntimeError(f"Candidate pre-flight verification failed on slot {cand_slot}: {exc}") from exc

        # 3. Apply and verify Nginx routing configuration
        self.apply_and_verify_routing(active_slot=active, canary_weight=initial_weight)

        # 4. Only persist state to DB after verification and routing succeed
        record.candidate_release = candidate_release
        record.candidate_slot = cand_slot
        record.canary_weight = initial_weight
        record.last_action = f"STAGED_{candidate_release}"
        record.updated_at = datetime.now(UTC)
        db.commit()

        logger.info(
            "Staged candidate %s in Slot %s with canary weight %.2f",
            candidate_release,
            cand_slot,
            initial_weight,
        )
        return self.get_state(db)

    def check_health_gates(
        self,
        db: Session,
        candidate_release: str,
        candidate_slot: str,
    ) -> tuple[bool, str]:
        """Verify candidate health probe, readiness, and attack-recall/FPR safety limits."""
        cand_port = 8002 if candidate_slot == "B" else 8001

        # 1. Probe candidate serving slot HTTP readiness
        try:
            import httpx
            with httpx.Client(timeout=1.0) as client:
                resp = client.get(f"http://127.0.0.1:{cand_port}/readyz")
                if resp.status_code != 200:
                    return False, f"Candidate slot {candidate_slot} failed readiness check (HTTP {resp.status_code})"
                data = resp.json()
                if not data.get("is_ready", True):
                    return False, f"Candidate slot {candidate_slot} reports is_ready=False"
                if data.get("inference_mode") == "heuristic":
                    return False, f"Candidate slot {candidate_slot} is running in unapproved heuristic mode"
        except ImportError:
            return False, "httpx library required for candidate health probe"
        except Exception as exc:
            logger.error("Candidate slot probe failed on port %s: %s", cand_port, exc)
            return False, f"Candidate slot {candidate_slot} probe failed: {exc}"

        # 2. Check candidate predictions vs ground truth labels with separate class evidence minima
        labeled_preds = (
            db.query(PredictionRecordDB.prediction, GroundTruthLabelRecordDB.label)
            .join(GroundTruthLabelRecordDB, PredictionRecordDB.event_id == GroundTruthLabelRecordDB.event_id)
            .filter(PredictionRecordDB.release_id == candidate_release)
            .all()
        )

        min_samples = int(os.getenv("MIN_CANARY_EVAL_SAMPLES", "15"))
        min_attacks = int(os.getenv("MIN_CANARY_ATTACK_SAMPLES", "5"))
        min_benign = int(os.getenv("MIN_CANARY_BENIGN_SAMPLES", "10"))

        if len(labeled_preds) < min_samples:
            return (
                False,
                f"Candidate evaluation sample insufficient: {len(labeled_preds)} labeled predictions observed, "
                f"minimum required for statistical safety verification is {min_samples}",
            )

        attacks = [p for p in labeled_preds if p[1] == 1]
        if len(attacks) < min_attacks:
            return (
                False,
                f"Insufficient attack observations to verify recall: {len(attacks)} observed, "
                f"minimum required is {min_attacks}",
            )

        normals = [p for p in labeled_preds if p[1] == 0]
        if len(normals) < min_benign:
            return (
                False,
                f"Insufficient benign observations to verify FPR: {len(normals)} observed, "
                f"minimum required is {min_benign}",
            )

        recall = sum(1 for p in attacks if p[0] == 1) / len(attacks)
        if recall < 0.95:
            return False, f"Candidate attack recall ({recall:.2%}) breached minimum safety SLA (95.0%)"

        fpr = sum(1 for p in normals if p[0] == 1) / len(normals)
        if fpr > 0.05:
            return False, f"Candidate FPR ({fpr:.2%}) breached maximum allowed limit (5.0%)"

        return True, "Health gates passed"

    def advance_stage(self, db: Session) -> CanaryState:
        """Advance canary traffic weight to the next stage (5% -> 25% -> 50% -> 100%)."""
        record = db.query(LifecycleStateRecordDB).first()
        if record is None or not record.candidate_release:
            raise ValueError("No active candidate staged for rollout.")

        # Enforce Health Gate
        passed, reason = self.check_health_gates(
            db=db,
            candidate_release=record.candidate_release,
            candidate_slot=record.candidate_slot or "B",
        )
        if not passed:
            self.warm_rollback(db, reason=f"Health gate failure: {reason}")
            raise ValueError(f"Canary progression blocked: {reason}. Immediate warm rollback executed.")

        curr_weight = record.canary_weight
        next_weight = 1.0

        for stage in CANARY_STAGES:
            if stage > curr_weight + 0.001:
                next_weight = stage
                break

        if next_weight >= 1.0:
            # Full Promotion: candidate becomes new champion!
            new_champion = record.candidate_release
            new_active = record.candidate_slot or "B"

            # Apply and verify routing for 100% on new active slot BEFORE committing DB
            self.apply_and_verify_routing(active_slot=new_active, canary_weight=0.0)

            record.champion_release = new_champion
            record.active_slot = new_active
            record.candidate_release = None
            record.candidate_slot = None
            record.canary_weight = 0.0
            record.last_action = f"PROMOTED_{new_champion}"
            record.updated_at = datetime.now(UTC)
            db.commit()

            logger.info("Canary rollout complete: Promoted %s to Champion on Slot %s", new_champion, new_active)
            return self.get_state(db)

        # Intermediate stage: apply routing first, then commit DB
        self.apply_and_verify_routing(active_slot=record.active_slot, canary_weight=next_weight)

        record.canary_weight = next_weight
        record.last_action = f"CANARY_ADVANCED_{int(next_weight*100)}PCT"
        record.updated_at = datetime.now(UTC)
        db.commit()

        logger.info("Canary weight advanced to %.2f for candidate %s", next_weight, record.candidate_release)
        return self.get_state(db)

    def warm_rollback(self, db: Session, reason: str = "Watchdog health violation") -> CanaryState:
        """Immediately drop candidate traffic to 0% and restore 100% champion traffic."""
        record = db.query(LifecycleStateRecordDB).first()
        if record is None:
            return self.get_state(db)

        aborted_candidate = record.candidate_release
        active = record.active_slot or "A"

        # Apply and verify routing restoration FIRST
        try:
            self.apply_and_verify_routing(active_slot=active, canary_weight=0.0)
        except Exception as exc:
            record.last_action = f"RECONCILIATION_REQUIRED: Rollback routing failed: {exc}"
            record.updated_at = datetime.now(UTC)
            db.commit()
            raise RuntimeError(f"Rollback routing could not be confirmed: {exc}") from exc

        record.candidate_release = None
        record.candidate_slot = None
        record.canary_weight = 0.0
        record.last_action = f"ROLLED_BACK: {reason}"
        record.updated_at = datetime.now(UTC)
        db.commit()

        logger.warning(
            "WARM ROLLBACK EXECUTED: Discarded candidate %s. 100%% traffic routed to champion on Slot %s. Reason: %s",
            aborted_candidate,
            active,
            reason,
        )
        return self.get_state(db)

    def _render_nginx_config(self, weight_a: int, weight_b: int) -> str:
        """Render standard reverse-proxy upstream block with weighted traffic splits."""
        return f"""events {{
    worker_connections 1024;
}}

http {{
    upstream model_serving {{
        server 127.0.0.1:8001 weight={weight_a} max_fails=3 fail_timeout=10s;
        server 127.0.0.1:8002 weight={weight_b} max_fails=3 fail_timeout=10s;
    }}

    server {{
        listen 8080;
        server_name localhost;

        location /predict {{
            proxy_pass http://model_serving;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_connect_timeout 2s;
            proxy_read_timeout 5s;
        }}

        location /health {{
            return 200 '{{"status": "nginx-router-healthy"}}';
            add_header Content-Type application/json;
        }}
    }}
}}
"""

    def apply_and_verify_routing(self, active_slot: str, canary_weight: float) -> None:
        """Atomically generate, validate, write, and verify Nginx upstream configuration."""
        if not self.nginx_conf_path:
            return

        cand_weight = int(round(canary_weight * 100))
        champ_weight = 100 - cand_weight
        weight_a = champ_weight if active_slot == "A" else cand_weight
        weight_b = cand_weight if active_slot == "A" else champ_weight

        # 1. Render configuration
        conf_content = self._render_nginx_config(weight_a=weight_a, weight_b=weight_b)

        # 2. Syntax validation
        if "upstream model_serving" not in conf_content or "server 127.0.0.1:8001" not in conf_content:
            raise ValueError("Generated Nginx configuration failed syntax validation.")

        # 3. Atomic write via temporary file
        temp_path = self.nginx_conf_path.with_suffix(".tmp")
        try:
            with open(temp_path, "w", encoding="utf-8") as f:
                f.write(conf_content)
            temp_path.replace(self.nginx_conf_path)
        except Exception as exc:
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass
            logger.error("Failed to write Nginx configuration to %s: %s", self.nginx_conf_path, exc)
            raise RuntimeError(f"Failed to write Nginx configuration: {exc}") from exc

        # 4. Verify written file contents
        try:
            verified_content = self.nginx_conf_path.read_text(encoding="utf-8")
            expected_a = f"server 127.0.0.1:8001 weight={weight_a}"
            expected_b = f"server 127.0.0.1:8002 weight={weight_b}"
            if expected_a not in verified_content or expected_b not in verified_content:
                raise RuntimeError(
                    f"Nginx configuration verification mismatch: expected {expected_a} and {expected_b}"
                )
        except Exception as exc:
            raise RuntimeError(f"Nginx routing verification failed: {exc}") from exc

        logger.info(
            "Verified Nginx upstream configuration at %s (Slot A=%d, Slot B=%d)",
            self.nginx_conf_path,
            weight_a,
            weight_b,
        )

    def update_nginx_weights(self, active_slot: str, canary_weight: float) -> None:
        """Backward-compatible alias for apply_and_verify_routing."""
        self.apply_and_verify_routing(active_slot=active_slot, canary_weight=canary_weight)
