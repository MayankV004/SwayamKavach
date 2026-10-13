"""Unit tests for Zeek feature adapter."""

from swayamkavach.features.adapter import ZeekConnAdapter


def test_zeek_conn_adapter_valid_record():
    """Verify conversion of standard Zeek log dict to TONConnectionFeatures."""
    raw = {
        "ts": 1599824000.123,
        "uid": "CHkAvb1n35k7PQ90",
        "id.orig_h": "192.168.1.100",
        "id.orig_p": 49152,
        "id.resp_h": "192.168.1.1",
        "id.resp_p": 80,
        "proto": "tcp",
        "service": "http",
        "duration": "2.45",
        "orig_bytes": "500",
        "resp_bytes": "1200",
        "conn_state": "SF",
        "orig_pkts": "8",
        "resp_pkts": "12",
        "orig_ip_bytes": "820",
        "resp_ip_bytes": "1680",
        "missed_bytes": "0",
    }

    features = ZeekConnAdapter.to_features(raw)
    assert features.duration == 2.45
    assert features.src_bytes == 500
    assert features.dst_bytes == 1200
    assert features.src_ip_bytes == 820
    assert features.proto == "tcp"
    assert features.service == "http"
    assert features.conn_state == "SF"

    identifiers = ZeekConnAdapter.to_identifiers(raw)
    assert identifiers.src_ip == "192.168.1.100"
    assert identifiers.dst_ip == "192.168.1.1"
    assert identifiers.src_port == 49152
    assert identifiers.dst_port == 80


def test_zeek_conn_adapter_handles_null_dashes():
    """Verify handling of Zeek unset values represented as '-'."""
    raw = {
        "duration": "-",
        "orig_bytes": "-",
        "resp_bytes": "-",
        "service": "-",
        "conn_state": "S0",
    }

    features = ZeekConnAdapter.to_features(raw)
    assert features.duration == 0.0
    assert features.src_bytes == 0
    assert features.dst_bytes == 0
    assert features.service == "-"
    assert features.conn_state == "S0"
