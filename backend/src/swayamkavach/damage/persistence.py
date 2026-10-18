"""Window-level damage persistence tracking for DARI self-healing lifecycle.

Implements temporal persistence (R) calculation across successive evaluation windows:
  - Persists window damage measurements (D_X, D_Y, D_B, Q, L, S, is_anomalous) to database.
  - Determines whether an observation window is anomalous based on configured thresholds.
  - Computes R as the number of unbroken consecutive anomalous windows.
  - Resets R when transient drift clears.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from swayamkavach.db.models import WindowDamageHistoryDB

logger = logging.getLogger("swayamkavach.damage.persistence")

# Default detection thresholds for window anomaly classification
DEFAULT_DRIFT_THRESHOLD = 0.25
DEFAULT_BOUNDARY_THRESHOLD = 0.15
DEFAULT_PERFORMANCE_THRESHOLD = 0.05


class PersistenceTracker:
    """Computes and tracks consecutive anomalous monitoring windows."""

    def __init__(
        self,
        drift_threshold: float = DEFAULT_DRIFT_THRESHOLD,
        boundary_threshold: float = DEFAULT_BOUNDARY_THRESHOLD,
        performance_threshold: float = DEFAULT_PERFORMANCE_THRESHOLD,
    ):
        self.drift_threshold = drift_threshold
        self.boundary_threshold = boundary_threshold
        self.performance_threshold = performance_threshold

    def is_anomalous(
        self,
        d_x: float,
        d_y: float | None,
        d_b: float,
    ) -> bool:
        """Classify whether an individual window exhibits actionable damage/drift."""
        if d_x >= self.drift_threshold:
            return True
        if d_y is not None and d_y >= self.performance_threshold:
            return True
        if d_b >= self.boundary_threshold:
            return True
        return False

    def record_and_compute_persistence(
        self,
        db: Session,
        window_id: str,
        d_x: float,
        d_y: float | None,
        d_b: float,
        q: float,
        l: float,  # noqa: E741
        s: int,
        is_anom: bool | None = None,
    ) -> int:
        """Persist window damage record and return the current consecutive persistence count R."""
        if is_anom is None:
            is_anom = self.is_anomalous(d_x=d_x, d_y=d_y, d_b=d_b)

        record = WindowDamageHistoryDB(
            window_id=window_id,
            d_x=float(d_x),
            d_y=float(d_y) if d_y is not None else None,
            d_b=float(d_b),
            q=float(q),
            l=float(l),
            s=int(s),
            is_anomalous=bool(is_anom),
            evaluated_at=datetime.now(UTC),
        )
        db.add(record)
        db.commit()

        # Query recent history in reverse chronological order
        stmt = (
            select(WindowDamageHistoryDB.is_anomalous)
            .order_by(desc(WindowDamageHistoryDB.id))
            .limit(50)
        )
        history = db.execute(stmt).scalars().all()

        if not history or not history[0]:
            # Current window is nominal
            return 1

        consecutive_anomalous = 0
        for anom in history:
            if anom:
                consecutive_anomalous += 1
            else:
                break

        r_count = max(1, consecutive_anomalous)
        logger.info(
            "Window %s anomaly=%s -> Persistent consecutive damage count R=%d",
            window_id,
            is_anom,
            r_count,
        )
        return r_count

    def record_window(
        self,
        db: Session,
        window_id: str,
        d_x: float,
        d_b: float,
        q: float,
        l: float,  # noqa: E741
        s: int,
        d_y: float | None = None,
        is_anomalous: bool | None = None,
    ) -> int:
        """Alias for record_and_compute_persistence."""
        return self.record_and_compute_persistence(
            db=db,
            window_id=window_id,
            d_x=d_x,
            d_y=d_y,
            d_b=d_b,
            q=q,
            l=l,
            s=s,
            is_anom=is_anomalous,
        )

    def get_current_persistence(self, db: Session) -> int:
        """Query current persistence count R without inserting a new record."""
        stmt = (
            select(WindowDamageHistoryDB.is_anomalous)
            .order_by(desc(WindowDamageHistoryDB.id))
            .limit(50)
        )
        history = db.execute(stmt).scalars().all()

        if not history or not history[0]:
            return 1

        consecutive_anomalous = 0
        for anom in history:
            if anom:
                consecutive_anomalous += 1
            else:
                break

        return max(1, consecutive_anomalous)

    def clear_history(self, db: Session) -> None:
        """Purge window damage history (e.g. on reset)."""
        db.query(WindowDamageHistoryDB).delete()
        db.commit()
