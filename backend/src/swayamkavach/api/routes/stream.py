"""API routes for controlling live network stream feeds (IoT Replay & Live Sniffer)."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter

from swayamkavach.replay.feed_manager import FeedManager

logger = logging.getLogger("swayamkavach.api.stream")

router = APIRouter(prefix="/stream", tags=["Stream Feeds"])


@router.get("/status")
def get_stream_status() -> dict[str, Any]:
    """Return running state, packet counts, and event throughput of all feeds."""
    mgr = FeedManager.get_instance()
    return mgr.get_status()


@router.post("/replay/start")
def start_replay_feed() -> dict[str, Any]:
    """Start continuous streaming of real IoT attack/normal telemetry."""
    mgr = FeedManager.get_instance()
    return mgr.start_replay()


@router.post("/replay/stop")
def stop_replay_feed() -> dict[str, Any]:
    """Stop continuous streaming of IoT replay telemetry."""
    mgr = FeedManager.get_instance()
    return mgr.stop_replay()


@router.post("/sniffer/start")
def start_sniffer_feed() -> dict[str, Any]:
    """Start real-time packet capture on host network interfaces (WiFi/LAN)."""
    mgr = FeedManager.get_instance()
    return mgr.start_sniffer()


@router.post("/sniffer/stop")
def stop_sniffer_feed() -> dict[str, Any]:
    """Stop real-time packet capture on host interfaces."""
    mgr = FeedManager.get_instance()
    return mgr.stop_sniffer()


@router.post("/all/start")
def start_all_feeds() -> dict[str, Any]:
    """Start both IoT Replay and Host Live Sniffer simultaneously."""
    mgr = FeedManager.get_instance()
    return mgr.start_all()


@router.post("/all/stop")
def stop_all_feeds() -> dict[str, Any]:
    """Stop all active network stream feeds."""
    mgr = FeedManager.get_instance()
    return mgr.stop_all()
