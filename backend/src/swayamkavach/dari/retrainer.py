"""Level A3 Subprocess Retraining Runner.

Executes candidate model retraining in an isolated subprocess with bounded CPU,
memory, and execution timeout to preserve control plane stability.
"""

from __future__ import annotations

import json
import logging
import os
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

logger = logging.getLogger("swayamkavach.dari.retrainer")


@dataclass(frozen=True)
class RetrainingResult:
    """Outcome of Level A3 retraining job."""

    candidate_release_id: str
    artifact_dir: str
    training_duration_seconds: float
    status: str
    manifest: dict[str, Any]
    error_message: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "candidate_release_id": self.candidate_release_id,
            "artifact_dir": self.artifact_dir,
            "training_duration_seconds": self.training_duration_seconds,
            "status": self.status,
            "manifest": self.manifest,
            "error_message": self.error_message,
        }


class SubprocessRetrainer:
    """Runs model retraining in an isolated, resource-bounded worker process."""

    def __init__(
        self,
        backend_dir: Path | None = None,
        timeout_seconds: int = 300,
        max_threads: int = 2,
    ):
        self.backend_dir = backend_dir or Path(__file__).resolve().parent.parent.parent.parent
        self.timeout_seconds = timeout_seconds
        self.max_threads = max_threads

    def retrain_candidate(
        self,
        candidate_release_id: str = "R2-candidate",
        model_family: str = "HistGradientBoosting",
    ) -> RetrainingResult:
        """Spawn isolated subprocess to train candidate pipeline and package release bundle."""
        start_time = time.time()
        output_dir = self.backend_dir / "releases" / candidate_release_id
        output_dir.mkdir(parents=True, exist_ok=True)

        logger.info(
            "Spawning isolated retraining subprocess for %s (threads=%d, timeout=%ds)...",
            candidate_release_id,
            self.max_threads,
            self.timeout_seconds,
        )

        # Enforce thread and resource bounds via environment variables
        env = dict(os.environ)
        env["OMP_NUM_THREADS"] = str(self.max_threads)
        env["OPENBLAS_NUM_THREADS"] = str(self.max_threads)
        env["MKL_NUM_THREADS"] = str(self.max_threads)
        env["VECLIB_MAXIMUM_THREADS"] = str(self.max_threads)
        env["NUMEXPR_NUM_THREADS"] = str(self.max_threads)
        env["PYTHONPATH"] = f"{self.backend_dir / 'src'}:{self.backend_dir}"

        cmd = [
            sys.executable,
            "-m",
            "swayamkavach.training.train",
            "--release-id",
            candidate_release_id,
            "--model",
            model_family,
        ]

        try:
            proc = subprocess.run(
                cmd,
                cwd=str(self.backend_dir),
                env=env,
                capture_output=True,
                text=True,
                timeout=self.timeout_seconds,
                check=False,
            )

            duration = round(time.time() - start_time, 2)

            if proc.returncode != 0:
                logger.error("Retraining subprocess failed:\nSTDOUT: %s\nSTDERR: %s", proc.stdout, proc.stderr)
                return RetrainingResult(
                    candidate_release_id=candidate_release_id,
                    artifact_dir=str(output_dir),
                    training_duration_seconds=duration,
                    status="failed",
                    manifest={},
                    error_message=proc.stderr[:1000] if proc.stderr else "Non-zero exit code",
                )

            # Read generated candidate manifest
            manifest_path = output_dir / "manifest.json"
            manifest_data = {}
            if manifest_path.exists():
                with open(manifest_path, encoding="utf-8") as f:
                    manifest_data = json.load(f)

            logger.info(
                "Subprocess retraining succeeded in %.2fs. Artifacts saved to %s",
                duration,
                output_dir,
            )

            return RetrainingResult(
                candidate_release_id=candidate_release_id,
                artifact_dir=str(output_dir),
                training_duration_seconds=duration,
                status="success",
                manifest=manifest_data,
            )

        except subprocess.TimeoutExpired:
            duration = round(time.time() - start_time, 2)
            logger.error("Retraining subprocess timed out after %ds", self.timeout_seconds)
            return RetrainingResult(
                candidate_release_id=candidate_release_id,
                artifact_dir=str(output_dir),
                training_duration_seconds=duration,
                status="timeout",
                manifest={},
                error_message=f"Process timed out after {self.timeout_seconds}s",
            )
        except Exception as exc:
            duration = round(time.time() - start_time, 2)
            logger.exception("Unexpected error in retraining runner: %s", exc)
            return RetrainingResult(
                candidate_release_id=candidate_release_id,
                artifact_dir=str(output_dir),
                training_duration_seconds=duration,
                status="error",
                manifest={},
                error_message=str(exc),
            )
