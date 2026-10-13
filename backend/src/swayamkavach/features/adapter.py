"""Canonical Zeek conn.log to TON_IoT feature adapter.

Implements the contract mapping documented in Doc 07.
"""

from typing import Any

from schemas.flow_event import NetworkIdentifiers, TONConnectionFeatures


class ZeekConnAdapter:
    """Translates Zeek conn.log JSON entries to canonical TONConnectionFeatures."""

    @staticmethod
    def _safe_int(val: Any, default: int = 0) -> int:
        if val is None or val == "-":
            return default
        try:
            return int(val)
        except (ValueError, TypeError):
            return default

    @staticmethod
    def _safe_float(val: Any, default: float = 0.0) -> float:
        if val is None or val == "-":
            return default
        try:
            return float(val)
        except (ValueError, TypeError):
            return default

    @classmethod
    def to_features(cls, record: dict[str, Any]) -> TONConnectionFeatures:
        """Extract model features from a Zeek conn dictionary."""
        return TONConnectionFeatures(
            duration=cls._safe_float(record.get("duration")),
            src_bytes=cls._safe_int(record.get("orig_bytes") or record.get("src_bytes")),
            dst_bytes=cls._safe_int(record.get("resp_bytes") or record.get("dst_bytes")),
            src_ip_bytes=cls._safe_int(record.get("orig_ip_bytes") or record.get("src_ip_bytes")),
            dst_ip_bytes=cls._safe_int(record.get("resp_ip_bytes") or record.get("dst_ip_bytes")),
            src_pkts=cls._safe_int(record.get("orig_pkts") or record.get("src_pkts")),
            dst_pkts=cls._safe_int(record.get("resp_pkts") or record.get("dst_pkts")),
            proto=str(record.get("proto", "tcp")),
            service=str(record.get("service", "-")),
            conn_state=str(record.get("conn_state", "SF")),
            missed_bytes=cls._safe_int(record.get("missed_bytes")),
        )

    @classmethod
    def to_identifiers(cls, record: dict[str, Any]) -> NetworkIdentifiers:
        """Extract addressing metadata without leaking them into ML features."""
        src_ip = record.get("id.orig_h") or record.get("src_ip")
        dst_ip = record.get("id.resp_h") or record.get("dst_ip")
        src_port = cls._safe_int(record.get("id.orig_p") or record.get("src_port"), default=0)
        dst_port = cls._safe_int(record.get("id.resp_p") or record.get("dst_port"), default=0)

        return NetworkIdentifiers(
            src_ip=str(src_ip) if src_ip else None,
            dst_ip=str(dst_ip) if dst_ip else None,
            src_port=src_port if src_port > 0 else None,
            dst_port=dst_port if dst_port > 0 else None,
        )
