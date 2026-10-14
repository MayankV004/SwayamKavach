"""Monitoring window selector for DARI drift and damage assessment.

Extracts immutable evaluation windows W_t joining flow events, production predictions,
and delayed ground-truth labels with watermark tracking.
"""

from __future__ import annotations

import logging
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime

import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from swayamkavach.db.models import FlowEventRecordDB, GroundTruthLabelRecordDB, PredictionRecordDB

logger = logging.getLogger("swayamkavach.monitoring.window")


@dataclass(frozen=True)
class MonitoringWindow:
    """Immutable evaluation window W_t for drift and damage calculations."""

    window_id: str
    start_time: datetime
    end_time: datetime
    sample_count: int
    event_ids: list[str]
    features_df: pd.DataFrame
    scores: list[float]
    y_true: list[int] | None
    label_coverage: float
    label_reliability: float


class WindowSelector:
    """Selects sliding or tumbling windows from predicted flow events and delayed labels."""

    def __init__(self, window_size: int = 1000):
        self.window_size = window_size

    def select_latest_window(
        self,
        db: Session,
        window_size: int | None = None,
        watermark_end: datetime | None = None,
    ) -> MonitoringWindow | None:
        """Extract the most recent window of predicted flow events and joined predictions/labels.

        Returns None if no predicted events are available.
        """
        n_events = window_size or self.window_size

        # Query predicted events ordered by event_time desc
        stmt = (
            select(FlowEventRecordDB)
            .where(FlowEventRecordDB.is_predicted.is_(True))
        )
        if watermark_end is not None:
            stmt = stmt.where(FlowEventRecordDB.event_time <= watermark_end)

        stmt = stmt.order_by(FlowEventRecordDB.event_time.desc()).limit(n_events)
        events: Sequence[FlowEventRecordDB] = db.execute(stmt).scalars().all()

        if not events:
            logger.info("No predicted events found for monitoring window.")
            return None

        # Re-sort in chronological order
        events = sorted(events, key=lambda e: e.event_time)
        event_ids = [e.event_id for e in events]

        # Query corresponding production predictions
        pred_stmt = select(PredictionRecordDB).where(
            PredictionRecordDB.event_id.in_(event_ids),
            PredictionRecordDB.prediction_purpose == "production",
        )
        pred_records = db.execute(pred_stmt).scalars().all()
        pred_map = {p.event_id: float(p.score) for p in pred_records}

        # Query delayed ground-truth labels if present
        label_stmt = select(GroundTruthLabelRecordDB).where(
            GroundTruthLabelRecordDB.event_id.in_(event_ids)
        )
        label_records = db.execute(label_stmt).scalars().all()
        label_map = {lbl.event_id: int(lbl.label) for lbl in label_records}
        confidence_map = {lbl.event_id: float(lbl.confidence) for lbl in label_records}

        # Build feature DataFrame and synchronized score/label arrays
        feature_rows: list[dict] = []
        scores: list[float] = []
        y_true_list: list[int | None] = []

        for e in events:
            f = dict(e.features)
            feature_rows.append(f)
            scores.append(pred_map.get(e.event_id, 0.5))
            y_true_list.append(label_map.get(e.event_id, None))

        features_df = pd.DataFrame(feature_rows)

        # Calculate label coverage and reliability
        labelled_count = len(label_records)
        label_coverage = float(round(labelled_count / len(events), 4))
        avg_confidence = (
            float(round(sum(confidence_map.values()) / labelled_count, 4))
            if labelled_count > 0
            else 0.0
        )

        # y_true is only provided if at least some labels are present
        y_true_clean: list[int] | None = None
        if labelled_count > 0:
            # We filter aligned pairs for evaluation
            y_true_clean = [
                label_map[e_id]
                for e_id in event_ids
                if e_id in label_map
            ]

        start_time = events[0].event_time.replace(tzinfo=UTC) if events[0].event_time.tzinfo is None else events[0].event_time
        end_time = events[-1].event_time.replace(tzinfo=UTC) if events[-1].event_time.tzinfo is None else events[-1].event_time
        window_id = f"W_{start_time.strftime('%Y%m%dT%H%M%S')}_{end_time.strftime('%Y%m%dT%H%M%S')}_{len(events)}"

        return MonitoringWindow(
            window_id=window_id,
            start_time=start_time,
            end_time=end_time,
            sample_count=len(events),
            event_ids=event_ids,
            features_df=features_df,
            scores=scores,
            y_true=y_true_clean,
            label_coverage=label_coverage,
            label_reliability=avg_confidence,
        )
