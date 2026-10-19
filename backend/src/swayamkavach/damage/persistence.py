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

    def _compute_distinct_persistence(self, db: Session) -> int:
        """Calculate consecutive anomalous windows across distinct windows ordered by event time."""
        stmt = (
            select(WindowDamageHistoryDB)
            .order_by(
                desc(WindowDamageHistoryDB.window_end_at),
                desc(WindowDamageHistoryDB.sequence_num),
                desc(WindowDamageHistoryDB.id),
            )
            .limit(100)
        )
        records = db.execute(stmt).scalars().all()
        seen_windows: set[str] = set()
        distinct_windows: list[WindowDamageHistoryDB] = []
        for r in records:
            if r.window_id not in seen_windows:
                seen_windows.add(r.window_id)
                distinct_windows.append(r)

        if not distinct_windows or not distinct_windows[0].is_anomalous:
            return 1

        consecutive_anomalous = 0
        for w in distinct_windows:
            if w.is_anomalous:
                consecutive_anomalous += 1
            else:
                break

        return max(1, consecutive_anomalous)

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
        window_end_at: datetime | None = None,
        sequence_num: int | None = None,
    ) -> int:
        """Persist window damage record idempotently and return current consecutive persistence count R.

        Chronology Safety Invariant:
          - Ordering uses window_end_at (event time) or monotonic sequence_num.
          - Reprocessing an old window updates its evaluated_at, but preserves its original window_end_at.
          - An old window never jumps ahead of genuinely newer windows.
        """
        if is_anom is None:
            is_anom = self.is_anomalous(d_x=d_x, d_y=d_y, d_b=d_b)

        existing = (
            db.query(WindowDamageHistoryDB)
            .filter(WindowDamageHistoryDB.window_id == window_id)
            .first()
        )
        if existing is not None:
            existing.d_x = float(d_x)
            existing.d_y = float(d_y) if d_y is not None else None
            existing.d_b = float(d_b)
            existing.q = float(q)
            existing.l = float(l)
            existing.s = int(s)
            existing.is_anomalous = bool(is_anom)
            existing.evaluated_at = datetime.now(UTC)
            # Only update event time/sequence if explicitly requested; never inadvertently advance chronology
            if window_end_at is not None:
                existing.window_end_at = window_end_at
            if sequence_num is not None:
                existing.sequence_num = sequence_num
            db.commit()
        else:
            if sequence_num is None:
                from sqlalchemy import func
                max_seq = db.query(func.max(WindowDamageHistoryDB.sequence_num)).scalar() or 0
                seq = max_seq + 1
            else:
                seq = sequence_num

            event_time = window_end_at if window_end_at is not None else datetime.now(UTC)
            record = WindowDamageHistoryDB(
                window_id=window_id,
                d_x=float(d_x),
                d_y=float(d_y) if d_y is not None else None,
                d_b=float(d_b),
                q=float(q),
                l=float(l),
                s=int(s),
                is_anomalous=bool(is_anom),
                window_end_at=event_time,
                sequence_num=seq,
                evaluated_at=datetime.now(UTC),
            )
            db.add(record)
            db.commit()

        r_count = self._compute_distinct_persistence(db)
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
        window_end_at: datetime | None = None,
        sequence_num: int | None = None,
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
            window_end_at=window_end_at,
            sequence_num=sequence_num,
        )

    def get_current_persistence(self, db: Session) -> int:
        """Query current persistence count R without inserting a new record."""
        return self._compute_distinct_persistence(db)

    def clear_history(self, db: Session) -> None:
        """Purge window damage history (e.g. on reset)."""
        db.query(WindowDamageHistoryDB).delete()
        db.commit()
