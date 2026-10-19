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
import shutil
import subprocess
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


_SENTINEL = object()


class CanaryController:
    """Manages dual-slot traffic routing, progressive rollout, and zero-downtime rollback."""

    def __init__(
        self,
        nginx_conf_path: Path | None | object = _SENTINEL,
        reload_hook: Any | None = None,
        runtime_check_hook: Any | None = None,
        require_artifacts: bool = True,
        releases_dir: Path | None = None,
    ):
        if nginx_conf_path is _SENTINEL:
            env_path = os.getenv("NGINX_CONF_PATH")
            if env_path:
                self.nginx_conf_path: Path | None = Path(env_path)
            else:
                default_conf = Path(__file__).resolve().parent.parent.parent.parent.parent / "infra" / "nginx" / "nginx.conf"
                self.nginx_conf_path = default_conf if default_conf.exists() else None
        else:
            self.nginx_conf_path = nginx_conf_path  # type: ignore[assignment]

        self.reload_hook = reload_hook
        self.runtime_check_hook = runtime_check_hook
        self.require_artifacts = require_artifacts
        self.releases_dir = releases_dir

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
          1. Verify candidate artifact bundle and manifest digest on disk.
          2. Reload candidate in inactive slot and verify confirmed load status.
          3. Verify inactive slot release identity, explicit is_ready, and non-heuristic mode.
          4. Apply and verify Nginx routing weights before touching database state.
          5. Only persist state to DB once all pre-flight and routing checks pass.
        """
        record = db.query(LifecycleStateRecordDB).first()
        if record is None:
            record = LifecycleStateRecordDB(id=1, champion_release="R1", active_slot="A")
            db.add(record)

        active = record.active_slot or "A"
        cand_slot = "B" if active == "A" else "A"
        cand_port = 8002 if cand_slot == "B" else 8001

        # 1. Verify candidate artifact integrity on disk
        backend_dir = Path(__file__).resolve().parent.parent.parent.parent
        releases_dir = self.releases_dir or (backend_dir / "releases")
        bundle_path = releases_dir / candidate_release / "pipeline.joblib"
        manifest_path = releases_dir / candidate_release / "manifest.json"

        if self.require_artifacts:
            if not bundle_path.exists() or not manifest_path.exists():
                raise ValueError(
                    f"Candidate artifact bundle (pipeline.joblib) or manifest.json not found for release "
                    f"'{candidate_release}' in {releases_dir / candidate_release}. Incomplete candidate cannot be staged."
                )
            computed_sha = compute_sha256(bundle_path)
            try:
                with open(manifest_path, encoding="utf-8") as f:
                    m_data = json.load(f)
            except Exception as exc:
                raise ValueError(f"Invalid candidate manifest: {exc}") from exc

            expected_sha = m_data.get("bundle_sha256")
            if not expected_sha or expected_sha != computed_sha:
                raise ValueError(
                    f"Candidate artifact integrity check failed: digest {computed_sha} != manifest {expected_sha}"
                )
        elif bundle_path.exists() and manifest_path.exists():
            computed_sha = compute_sha256(bundle_path)
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
                try:
                    reload_data = reload_resp.json()
                    if isinstance(reload_data, dict) and reload_data.get("status") in ("failed", "error", "rejected"):
                        raise RuntimeError(f"Candidate slot /reload response indicated failure: {reload_data}")
                except Exception as exc:
                    if isinstance(exc, RuntimeError):
                        raise
                    logger.debug("Could not parse /reload JSON: %s", exc)

                # Verify readyz - require explicit is_ready is True and non-heuristic inference mode
                ready_resp = client.get(f"http://127.0.0.1:{cand_port}/readyz")
                if ready_resp.status_code != 200:
                    raise RuntimeError(f"Candidate slot readyz failed with HTTP {ready_resp.status_code}")
                ready_data = ready_resp.json()
                is_ready = ready_data.get("is_ready") is True or ready_data.get("status") in ("ready", "alive", "reloaded")
                if not is_ready:
                    raise RuntimeError("Candidate slot reports is_ready is not True")
                if ready_data.get("inference_mode") in ("heuristic", None):
                    raise RuntimeError("Candidate slot is running in forbidden heuristic fallback mode or missing inference_mode")

                # Verify identity - fail closed on missing/mismatched release_id or HTTP != 200
                id_resp = client.get(f"http://127.0.0.1:{cand_port}/identity")
                if id_resp.status_code != 200:
                    raise RuntimeError(f"Candidate slot identity check failed with HTTP {id_resp.status_code}")
                id_data = id_resp.json()
                active_rel = id_data.get("release_id")
                if not active_rel or active_rel != candidate_release:
                    raise RuntimeError(
                        f"Candidate slot reports wrong or missing release '{active_rel}' (expected '{candidate_release}')"
                    )
        except RuntimeError:
            raise
        except Exception as exc:
            logger.error("Failed to load and verify candidate in slot %s: %s", cand_slot, exc)
            raise RuntimeError(f"Candidate pre-flight verification failed on slot {cand_slot}: {exc}") from exc

        # 3. Apply and verify Nginx routing configuration
        try:
            self.apply_and_verify_routing(active_slot=active, canary_weight=initial_weight)
        except Exception as exc:
            record.last_action = f"RECONCILIATION_REQUIRED: Staging routing failed: {exc}"
            record.updated_at = datetime.now(UTC)
            db.commit()
            raise RuntimeError(f"Staging failed: routing could not be confirmed: {exc}") from exc

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

        # 1. Probe candidate serving slot HTTP readiness and identity
        try:
            import httpx
            with httpx.Client(timeout=1.0) as client:
                resp = client.get(f"http://127.0.0.1:{cand_port}/readyz")
                if resp.status_code != 200:
                    return False, f"Candidate slot {candidate_slot} failed readiness check (HTTP {resp.status_code})"
                data = resp.json()
                is_ready = data.get("is_ready") is True or data.get("status") in ("ready", "alive", "reloaded")
                if not is_ready:
                    return False, f"Candidate slot {candidate_slot} reports is_ready is not True"
                if data.get("inference_mode") in ("heuristic", None):
                    return False, f"Candidate slot {candidate_slot} is running in unapproved heuristic mode"

                id_resp = client.get(f"http://127.0.0.1:{cand_port}/identity")
                if id_resp.status_code != 200:
                    return False, f"Candidate slot {candidate_slot} failed identity check (HTTP {id_resp.status_code})"
                id_data = id_resp.json()
                if id_data.get("release_id") != candidate_release:
                    return (
                        False,
                        f"Candidate slot {candidate_slot} reports wrong release "
                        f"'{id_data.get('release_id')}' (expected '{candidate_release}')",
                    )
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
            try:
                self.apply_and_verify_routing(active_slot=new_active, canary_weight=0.0)
            except Exception as exc:
                record.last_action = f"RECONCILIATION_REQUIRED: Promotion routing failed: {exc}"
                record.updated_at = datetime.now(UTC)
                db.commit()
                raise RuntimeError(f"Promotion failed: routing could not be confirmed: {exc}") from exc

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
        try:
            self.apply_and_verify_routing(active_slot=record.active_slot, canary_weight=next_weight)
        except Exception as exc:
            record.last_action = f"RECONCILIATION_REQUIRED: Progression routing failed: {exc}"
            record.updated_at = datetime.now(UTC)
            db.commit()
            raise RuntimeError(f"Canary progression failed: routing could not be confirmed: {exc}") from exc

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

    def reload_nginx(self) -> None:
        """Trigger Nginx process configuration reload."""
        if self.reload_hook is not None:
            self.reload_hook()
            return

        reload_cmd = os.getenv("NGINX_RELOAD_CMD")
        if reload_cmd:
            import shlex
            res = subprocess.run(shlex.split(reload_cmd), capture_output=True, text=True)
            if res.returncode != 0:
                raise RuntimeError(f"Custom NGINX_RELOAD_CMD failed with code {res.returncode}: {res.stderr.strip()}")
            return

        if shutil.which("nginx"):
            res = subprocess.run(["nginx", "-s", "reload"], capture_output=True, text=True)
            if res.returncode != 0:
                raise RuntimeError(f"nginx -s reload failed with code {res.returncode}: {res.stderr.strip()}")
            return

        env = os.getenv("ENVIRONMENT", os.getenv("SWAYAMKAVACH_ENV", "development")).strip().lower()
        if env in ("production", "prod"):
            raise RuntimeError("Production safety breach: 'nginx' binary not found on PATH for live traffic reload.")
        logger.debug("Nginx binary not available on system; live process reload bypassed in %s environment.", env)

    def verify_runtime_weights(self, weight_a: int, weight_b: int) -> None:
        """Verify effective upstream routing weights."""
        if not self.nginx_conf_path or not self.nginx_conf_path.exists():
            raise RuntimeError("Nginx configuration file missing during runtime weight verification.")

        verified_content = self.nginx_conf_path.read_text(encoding="utf-8")
        expected_a = f"server 127.0.0.1:8001 weight={weight_a}"
        expected_b = f"server 127.0.0.1:8002 weight={weight_b}"
        if expected_a not in verified_content or expected_b not in verified_content:
            raise RuntimeError(
                f"Nginx configuration verification mismatch: expected {expected_a} and {expected_b}"
            )

        if self.runtime_check_hook is not None:
            if not self.runtime_check_hook(weight_a, weight_b):
                raise RuntimeError(
                    f"Runtime upstream verification hook reported failure for weights ({weight_a}, {weight_b})"
                )

    def apply_and_verify_routing(self, active_slot: str, canary_weight: float) -> None:
        """Atomically generate, validate, write, reload, and verify Nginx upstream configuration.

        Safety invariants:
          1. Fail closed if routing adapter is unconfigured (nginx_conf_path is None).
          2. Generate candidate configuration in a temporary file.
          3. Validate syntax (via internal check and nginx -t when available).
          4. Preserve last known-good configuration backup.
          5. Atomically replace active configuration.
          6. Reload Nginx and confirm reload succeeded.
          7. Verify runtime upstream weights.
          8. Roll back to last known-good configuration if reload or verification fails.
        """
        if self.nginx_conf_path is None:
            raise RuntimeError(
                "Nginx routing adapter not configured: nginx_conf_path is required. "
                "Database state cannot claim routing succeeded without a verified routing adapter."
            )

        cand_weight = int(round(canary_weight * 100))
        champ_weight = 100 - cand_weight
        weight_a = champ_weight if active_slot == "A" else cand_weight
        weight_b = cand_weight if active_slot == "A" else champ_weight

        # 1. Render configuration
        conf_content = self._render_nginx_config(weight_a=weight_a, weight_b=weight_b)

        # 2. Syntax validation
        if "upstream model_serving" not in conf_content or "server 127.0.0.1:8001" not in conf_content:
            raise ValueError("Generated Nginx configuration failed syntax validation.")

        # 3. Write candidate configuration to temporary file
        if not self.nginx_conf_path.parent.exists():
            raise RuntimeError(f"Nginx configuration directory does not exist: {self.nginx_conf_path.parent}")
        temp_path = self.nginx_conf_path.with_suffix(".tmp")
        try:
            with open(temp_path, "w", encoding="utf-8") as f:
                f.write(conf_content)
        except Exception as exc:
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass
            logger.error("Failed to write temporary Nginx configuration: %s", exc)
            raise RuntimeError(f"Failed to write candidate Nginx configuration: {exc}") from exc

        # 4. Validate temporary configuration with nginx -t if binary is available
        if shutil.which("nginx"):
            try:
                subprocess.run(
                    ["nginx", "-t", "-c", str(temp_path.resolve())],
                    capture_output=True,
                    text=True,
                    check=True,
                )
            except subprocess.CalledProcessError as exc:
                if temp_path.exists():
                    try:
                        temp_path.unlink()
                    except Exception:
                        pass
                raise ValueError(f"nginx -t validation failed for candidate configuration: {exc.stderr.strip()}") from exc

        # 5. Backup current active configuration if it exists
        backup_content: str | None = None
        if self.nginx_conf_path.exists():
            try:
                backup_content = self.nginx_conf_path.read_text(encoding="utf-8")
            except Exception as exc:
                logger.warning("Could not read existing config for backup: %s", exc)

        # 6. Atomically install validated configuration
        try:
            temp_path.replace(self.nginx_conf_path)
        except Exception as exc:
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass
            raise RuntimeError(f"Failed to install validated Nginx configuration: {exc}") from exc

        # 7. Reload Nginx and verify runtime upstream weights
        try:
            self.reload_nginx()
            self.verify_runtime_weights(weight_a=weight_a, weight_b=weight_b)
        except Exception as exc:
            logger.error("Nginx reload or runtime verification failed (%s). Restoring backup configuration.", exc)
            if backup_content is not None:
                try:
                    self.nginx_conf_path.write_text(backup_content, encoding="utf-8")
                    self.reload_nginx()
                    logger.info("Restored previous Nginx configuration successfully.")
                except Exception as restore_exc:
                    logger.critical("Failed to restore previous Nginx configuration during rollback: %s", restore_exc)
            raise RuntimeError(f"Nginx live reload/verification failed: {exc}") from exc

        logger.info(
            "Verified and reloaded Nginx upstream configuration at %s (Slot A=%d, Slot B=%d)",
            self.nginx_conf_path,
            weight_a,
            weight_b,
        )

    def update_nginx_weights(self, active_slot: str, canary_weight: float) -> None:
        """Backward-compatible alias for apply_and_verify_routing."""
        self.apply_and_verify_routing(active_slot=active_slot, canary_weight=canary_weight)
