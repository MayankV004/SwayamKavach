"""Canonical flow event schemas for SwayamKavach.

Implements the ton-conn-v1 Zeek connection schema specifications from Doc 04 & Doc 07.
Network identifiers (IPs, ports) are kept separate from predictive ML features.
"""

from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field


class TONConnectionFeatures(BaseModel):
    """Predictive features extracted from Zeek conn.log or TON_IoT connection flow."""

    model_config = ConfigDict(extra="forbid")

    # Core 5-feature baseline subset
    duration: float = Field(default=0.0, ge=0.0, description="Connection duration in seconds")
    src_bytes: int = Field(default=0, ge=0, description="Originator payload bytes (orig_bytes)")
    dst_bytes: int = Field(default=0, ge=0, description="Responder payload bytes (resp_bytes)")
    src_ip_bytes: int = Field(default=0, ge=0, description="Originator IP bytes (orig_ip_bytes)")
    dst_ip_bytes: int = Field(default=0, ge=0, description="Responder IP bytes (resp_ip_bytes)")

    # Extended 11-feature connection set
    src_pkts: int | None = Field(default=0, ge=0, description="Originator packets count")
    dst_pkts: int | None = Field(default=0, ge=0, description="Responder packets count")
    proto: str | None = Field(default="tcp", description="Transport protocol (e.g., tcp, udp, icmp)")
    service: str | None = Field(default="-", description="Identified application service (e.g., http, dns, -)")
    conn_state: str | None = Field(default="SF", description="Zeek connection state (e.g., SF, S0, REJ)")
    missed_bytes: int | None = Field(default=0, ge=0, description="Missed bytes for packet capture quality tracking")


class NetworkIdentifiers(BaseModel):
    """Network identifiers isolated from model training to prevent spurious correlation leakage."""

    src_ip: str | None = Field(default=None, description="Source IP address")
    dst_ip: str | None = Field(default=None, description="Destination IP address")
    src_port: int | None = Field(default=None, ge=0, le=65535, description="Source port")
    dst_port: int | None = Field(default=None, ge=0, le=65535, description="Destination port")


class FlowEvent(BaseModel):
    """Unit flow event with provenance, timestamping, and isolated features."""

    event_id: str = Field(..., description="Globally unique flow event ID")
    sensor_id: str = Field(..., description="ID of sensor that captured the flow")
    capture_id: str | None = Field(default=None, description="PCAP capture session ID")
    event_time: datetime = Field(..., description="UTC timestamp of flow end/expiration")
    feature_ready_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="UTC timestamp feature extraction was completed"
    )
    
    # Model predictive features
    features: TONConnectionFeatures = Field(..., description="Extracted numerical & categorical features")
    
    # Isolated network context (never fed directly to ML model)
    identifiers: NetworkIdentifiers | None = Field(default=None, description="Connection addressing metadata")
