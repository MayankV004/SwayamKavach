"""Real-time network traffic feed manager for SwayamKavach.

Manages two independent continuous live feeds:
1. IoT Replay Stream (Option 2): Streams verified IoT testbed attack/normal flows from replay_features.csv.gz.
2. Host Live Sniffer (Option 1): Captures real-time WiFi/LAN packets from the host and transforms them into Zeek flows.
"""

from __future__ import annotations

import logging
import re
import subprocess
import threading
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pandas as pd
import requests

from schemas.flow_event import FlowEvent, NetworkIdentifiers, TONConnectionFeatures
from schemas.ingestion import BatchIngestRequest

logger = logging.getLogger("swayamkavach.replay.feed_manager")


@dataclass
class FlowTracker:
    """Tracks state and statistics for an active 5-tuple network connection."""

    start_ts: float
    last_ts: float
    src_ip: str
    src_port: int
    dst_ip: str
    dst_port: int
    proto: str
    src_bytes: int = 0
    dst_bytes: int = 0
    src_pkts: int = 0
    dst_pkts: int = 0
    conn_state: str = "SF"


class ReplayStreamWorker:
    """Background worker streaming real ToN_IoT flows in continuous batches."""

    def __init__(
        self,
        features_path: Path,
        api_url: str = "http://localhost:8000/api/v1/ingestion/batches",
        batch_size: int = 15,
        interval_seconds: float = 1.5,
    ):
        self.features_path = features_path
        self.api_url = api_url
        self.batch_size = batch_size
        self.interval_seconds = interval_seconds
        self._thread: threading.Thread | None = None
        self._stop_event = threading.Event()
        self.is_running = False
        self.batches_sent = 0
        self.events_sent = 0
        self.last_batch_time: str | None = None
        self._df: pd.DataFrame | None = None

    def start(self) -> bool:
        if self.is_running:
            return True
        if not self.features_path.exists():
            logger.error("Replay features file not found at %s", self.features_path)
            return False

        try:
            if self._df is None:
                self._df = pd.read_csv(self.features_path)
        except Exception as e:
            logger.error("Failed to load replay features: %s", e)
            return False

        self._stop_event.clear()
        self.is_running = True
        self._thread = threading.Thread(target=self._run, daemon=True, name="ReplayStreamWorker")
        self._thread.start()
        logger.info("Started IoT Replay Stream Worker (batch_size=%d, interval=%.1fs)", self.batch_size, self.interval_seconds)
        return True

    def stop(self) -> bool:
        if not self.is_running:
            return True
        self._stop_event.set()
        self.is_running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
        logger.info("Stopped IoT Replay Stream Worker.")
        return True

    def _run(self) -> None:
        assert self._df is not None
        total_rows = len(self._df)
        cursor = 0
        batch_counter = 0

        while not self._stop_event.is_set():
            end_cursor = min(cursor + self.batch_size, total_rows)
            chunk = self._df.iloc[cursor:end_cursor]

            if len(chunk) > 0:
                batch_counter += 1
                batch_id = f"stream-replay-{batch_counter:05d}"
                events = []
                now = datetime.now(UTC)

                for _, row in chunk.iterrows():
                    feat = TONConnectionFeatures(
                        duration=float(row.get("duration", 0.0)),
                        src_bytes=int(row.get("src_bytes", 0)),
                        dst_bytes=int(row.get("dst_bytes", 0)),
                        src_ip_bytes=int(row.get("src_ip_bytes", 0)),
                        dst_ip_bytes=int(row.get("dst_ip_bytes", 0)),
                        src_pkts=int(row.get("src_pkts", 0)),
                        dst_pkts=int(row.get("dst_pkts", 0)),
                        proto=str(row.get("proto", "tcp")),
                        service=str(row.get("service", "-")),
                        conn_state=str(row.get("conn_state", "SF")),
                        missed_bytes=int(row.get("missed_bytes", 0)),
                    )
                    ident = NetworkIdentifiers(
                        src_ip=str(row["src_ip"]) if pd.notna(row.get("src_ip")) else "192.168.1.100",
                        dst_ip=str(row["dst_ip"]) if pd.notna(row.get("dst_ip")) else "192.168.1.1",
                        src_port=int(row["src_port"]) if pd.notna(row.get("src_port")) and int(row["src_port"]) > 0 else 45000,
                        dst_port=int(row["dst_port"]) if pd.notna(row.get("dst_port")) and int(row["dst_port"]) > 0 else 80,
                    )
                    events.append(
                        FlowEvent(
                            event_id=f"evt-{batch_id}-{len(events) + 1}",
                            sensor_id="iot-replay-sensor-01",
                            event_time=now,
                            features=feat,
                            identifiers=ident,
                        )
                    )

                req = BatchIngestRequest(
                    batch_id=batch_id,
                    sensor_id="iot-replay-sensor-01",
                    schema_version="ton-conn-11-v1",
                    extractor_id="iot-replay-v1",
                    events=events,
                )

                try:
                    resp = requests.post(self.api_url, json=req.model_dump(mode="json"), timeout=4.0)
                    if resp.status_code == 202:
                        self.batches_sent += 1
                        self.events_sent += len(events)
                        self.last_batch_time = now.isoformat()
                except Exception as exc:
                    logger.warning("Replay batch delivery error: %s", exc)

            cursor = end_cursor
            if cursor >= total_rows:
                cursor = 0  # Loop back to begin continuous stream

            time.sleep(self.interval_seconds)

    def get_status(self) -> dict[str, Any]:
        return {
            "is_running": self.is_running,
            "batches_sent": self.batches_sent,
            "events_sent": self.events_sent,
            "batch_size": self.batch_size,
            "last_batch_time": self.last_batch_time,
        }


class LiveSnifferWorker:
    """Background worker capturing live host packets and generating Zeek connection flows."""

    CONTAINER_NAME = "swayamkavach-live-sniff"

    def __init__(
        self,
        api_url: str = "http://localhost:8000/api/v1/ingestion/batches",
        flush_interval: float = 2.0,
        batch_size: int = 10,
    ):
        self.api_url = api_url
        self.flush_interval = flush_interval
        self.batch_size = batch_size
        self._thread: threading.Thread | None = None
        self._stop_event = threading.Event()
        self._proc: subprocess.Popen | None = None
        self.is_running = False
        self.packets_captured = 0
        self.flows_ingested = 0
        self.last_packet_time: str | None = None
        self._flows: dict[str, FlowTracker] = {}
        self._lock = threading.Lock()

    def start(self) -> bool:
        if self.is_running:
            return True

        self._stop_event.clear()
        self.is_running = True
        self._thread = threading.Thread(target=self._run, daemon=True, name="LiveSnifferWorker")
        self._thread.start()
        logger.info("Started Host Live Sniffer Worker.")
        return True

    def stop(self) -> bool:
        if not self.is_running:
            return True
        self._stop_event.set()
        self.is_running = False

        # Terminate container or subprocess
        try:
            subprocess.run(["docker", "rm", "-f", self.CONTAINER_NAME], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass

        if self._proc:
            try:
                self._proc.terminate()
                self._proc.wait(timeout=1.5)
            except Exception:
                try:
                    self._proc.kill()
                except Exception:
                    pass
            self._proc = None

        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)

        logger.info("Stopped Host Live Sniffer Worker.")
        return True

    def _infer_service(self, port: int) -> str:
        services = {
            53: "dns",
            80: "http",
            443: "ssl",
            8080: "http",
            22: "ssh",
            21: "ftp",
            1883: "mqtt",
            8883: "mqtt",
            123: "ntp",
            67: "dhcp",
            68: "dhcp",
        }
        return services.get(port, "-")

    def _flush_flows_to_api(self) -> None:
        with self._lock:
            if not self._flows:
                return

            now = datetime.now(UTC)
            events = []
            keys_to_remove = []

            for key, tracker in list(self._flows.items()):
                duration = max(0.001, tracker.last_ts - tracker.start_ts)
                service = self._infer_service(tracker.dst_port)

                feat = TONConnectionFeatures(
                    duration=float(round(duration, 4)),
                    src_bytes=int(tracker.src_bytes),
                    dst_bytes=int(tracker.dst_bytes),
                    src_ip_bytes=int(tracker.src_bytes + 20 * tracker.src_pkts),
                    dst_ip_bytes=int(tracker.dst_bytes + 20 * tracker.dst_pkts),
                    src_pkts=int(max(1, tracker.src_pkts)),
                    dst_pkts=int(tracker.dst_pkts),
                    proto=tracker.proto.lower(),
                    service=service,
                    conn_state=tracker.conn_state,
                    missed_bytes=0,
                )
                ident = NetworkIdentifiers(
                    src_ip=tracker.src_ip,
                    dst_ip=tracker.dst_ip,
                    src_port=tracker.src_port,
                    dst_port=tracker.dst_port,
                )

                events.append(
                    FlowEvent(
                        event_id=f"live-{int(time.time()*1000)}-{len(events)}",
                        sensor_id="host-wifi-sniffer",
                        event_time=now,
                        features=feat,
                        identifiers=ident,
                    )
                )
                keys_to_remove.append(key)
                if len(events) >= self.batch_size:
                    break

            for k in keys_to_remove:
                self._flows.pop(k, None)

        if events:
            batch_id = f"live-sniff-batch-{int(time.time())}"
            req = BatchIngestRequest(
                batch_id=batch_id,
                sensor_id="host-wifi-sniffer",
                schema_version="ton-conn-11-v1",
                extractor_id="live-host-sniffer-v1",
                events=events,
            )
            try:
                resp = requests.post(self.api_url, json=req.model_dump(mode="json"), timeout=4.0)
                if resp.status_code == 202:
                    self.flows_ingested += len(events)
            except Exception as e:
                logger.warning("Failed to submit live sniff batch: %s", e)

    def _run(self) -> None:
        # Launch docker tcpdump without root
        cmd = [
            "docker",
            "run",
            "--rm",
            "--name",
            self.CONTAINER_NAME,
            "--net=host",
            "--cap-add=NET_RAW",
            "alpine",
            "sh",
            "-c",
            "apk add --no-cache tcpdump >/dev/null 2>&1 && exec tcpdump -l -n -tt -q -i any 'not (port 8000 or port 8001 or port 8002 or port 3000 or port 5000)'",
        ]

        try:
            self._proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                text=True,
                bufsize=1,
            )
        except Exception as e:
            logger.error("Failed to launch docker tcpdump sniffer: %s", e)
            self.is_running = False
            return

        # Pattern: 1792067711.103537 lo In IP 127.0.0.1.40117 > 127.0.0.1.47832: tcp 1999
        # Or: 1792067711.103556 wlp2s0 In IP 172.16.34.156.443 > 192.168.1.1.53: UDP, length 45
        pattern = re.compile(
            r"^(\d+\.\d+)\s+\S+\s+\S+\s+IP\s+([\d\.]+)\.(\d+)\s+>\s+([\d\.]+)\.(\d+):\s*([A-Za-z]+)?.*?(?:length\s+(\d+)|\s+(\d+))?"
        )

        last_flush = time.time()

        while not self._stop_event.is_set() and self._proc and self._proc.poll() is None:
            if self._proc.stdout is None:
                break

            line = self._proc.stdout.readline()
            if not line:
                time.sleep(0.05)
                continue

            match = pattern.search(line.strip())
            if match:
                ts = float(match.group(1))
                s_ip = match.group(2)
                s_port = int(match.group(3))
                d_ip = match.group(4)
                d_port = int(match.group(5))
                proto = (match.group(6) or "tcp").lower()
                length = int(match.group(7) or match.group(8) or 64)

                self.packets_captured += 1
                self.last_packet_time = datetime.now(UTC).isoformat()

                flow_key = f"{s_ip}:{s_port}->{d_ip}:{d_port}:{proto}"
                reverse_key = f"{d_ip}:{d_port}->{s_ip}:{s_port}:{proto}"

                with self._lock:
                    if flow_key in self._flows:
                        f = self._flows[flow_key]
                        f.src_bytes += length
                        f.src_pkts += 1
                        f.last_ts = ts
                    elif reverse_key in self._flows:
                        f = self._flows[reverse_key]
                        f.dst_bytes += length
                        f.dst_pkts += 1
                        f.last_ts = ts
                    else:
                        self._flows[flow_key] = FlowTracker(
                            start_ts=ts,
                            last_ts=ts,
                            src_ip=s_ip,
                            src_port=s_port,
                            dst_ip=d_ip,
                            dst_port=d_port,
                            proto=proto,
                            src_bytes=length,
                            src_pkts=1,
                        )

            if time.time() - last_flush >= self.flush_interval:
                self._flush_flows_to_api()
                last_flush = time.time()

        # Stop cleanup
        self._flush_flows_to_api()
        try:
            subprocess.run(["docker", "rm", "-f", self.CONTAINER_NAME], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass

    def get_status(self) -> dict[str, Any]:
        return {
            "is_running": self.is_running,
            "packets_captured": self.packets_captured,
            "flows_ingested": self.flows_ingested,
            "active_flows_in_buffer": len(self._flows),
            "last_packet_time": self.last_packet_time,
            "interface": "any (wlp2s0 / lo)",
        }


class FeedManager:
    """Singleton controller managing both Replay and Live Sniffer feeds."""

    _instance: FeedManager | None = None

    def __init__(self):
        backend_dir = Path(__file__).resolve().parent.parent.parent.parent
        features_path = backend_dir / "data" / "processed" / "replay_features.csv.gz"
        self.replay_worker = ReplayStreamWorker(features_path=features_path)
        self.sniffer_worker = LiveSnifferWorker()

    @classmethod
    def get_instance(cls) -> FeedManager:
        if cls._instance is None:
            cls._instance = FeedManager()
        return cls._instance

    def start_replay(self) -> dict[str, Any]:
        success = self.replay_worker.start()
        return {"action": "start_replay", "success": success, "status": self.replay_worker.get_status()}

    def stop_replay(self) -> dict[str, Any]:
        success = self.replay_worker.stop()
        return {"action": "stop_replay", "success": success, "status": self.replay_worker.get_status()}

    def start_sniffer(self) -> dict[str, Any]:
        success = self.sniffer_worker.start()
        return {"action": "start_sniffer", "success": success, "status": self.sniffer_worker.get_status()}

    def stop_sniffer(self) -> dict[str, Any]:
        success = self.sniffer_worker.stop()
        return {"action": "stop_sniffer", "success": success, "status": self.sniffer_worker.get_status()}

    def start_all(self) -> dict[str, Any]:
        r_ok = self.replay_worker.start()
        s_ok = self.sniffer_worker.start()
        return {
            "action": "start_all",
            "success": r_ok and s_ok,
            "replay": self.replay_worker.get_status(),
            "sniffer": self.sniffer_worker.get_status(),
        }

    def stop_all(self) -> dict[str, Any]:
        r_ok = self.replay_worker.stop()
        s_ok = self.sniffer_worker.stop()
        return {
            "action": "stop_all",
            "success": r_ok and s_ok,
            "replay": self.replay_worker.get_status(),
            "sniffer": self.sniffer_worker.get_status(),
        }

    def get_status(self) -> dict[str, Any]:
        return {
            "replay": self.replay_worker.get_status(),
            "sniffer": self.sniffer_worker.get_status(),
            "any_active": self.replay_worker.is_running or self.sniffer_worker.is_running,
            "both_active": self.replay_worker.is_running and self.sniffer_worker.is_running,
        }
