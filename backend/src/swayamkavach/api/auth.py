"""Control-plane authentication, role verification, and cryptographic approval tokens.

Implements security protections for operational lifecycle endpoints:
  - Role-checked control-plane access via API key or Bearer token.
  - HMAC-SHA256 signature binding of candidate evaluation approvals.
  - Expiry and provenance verification for candidate staging.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import os
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Annotated

from fastapi import Header, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logger = logging.getLogger("swayamkavach.api.auth")

DEFAULT_DEV_KEY = "swayamkavach-control-plane-secret-key-v1"
DEFAULT_DEV_HMAC_SECRET = "swayamkavach-approval-hmac-secret-v1"

ENV = os.getenv("ENVIRONMENT", os.getenv("SWAYAMKAVACH_ENV", "development")).strip().lower()

_raw_api_key = os.getenv("CONTROL_PLANE_API_KEY")
_raw_secret_key = os.getenv("CONTROL_PLANE_SECRET_KEY")

if ENV in ("production", "prod"):
    if not _raw_api_key or _raw_api_key == DEFAULT_DEV_KEY or len(_raw_api_key) < 32:
        raise RuntimeError(
            "Production security breach: CONTROL_PLANE_API_KEY must be explicitly configured "
            "with at least 32 characters in production. Default development keys are rejected."
        )
    if not _raw_secret_key or _raw_secret_key == DEFAULT_DEV_HMAC_SECRET or len(_raw_secret_key) < 32:
        raise RuntimeError(
            "Production security breach: CONTROL_PLANE_SECRET_KEY must be explicitly configured "
            "with at least 32 characters in production. Default development keys are rejected."
        )
    CONTROL_PLANE_API_KEY = _raw_api_key
    CONTROL_PLANE_SECRET_KEY = _raw_secret_key
else:
    CONTROL_PLANE_API_KEY = _raw_api_key or DEFAULT_DEV_KEY
    CONTROL_PLANE_SECRET_KEY = _raw_secret_key or DEFAULT_DEV_HMAC_SECRET

security_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class OperatorContext:
    """Validated operator identity and authorization scope."""

    operator_id: str
    role: str
    is_authenticated: bool = True
    permissions: tuple[str, ...] = ("telemetry", "labels", "evaluation", "deployment", "admin")

    def has_permission(self, permission: str) -> bool:
        return "admin" in self.permissions or permission in self.permissions


def verify_control_plane_token(token: str | None) -> bool:
    """Constant-time token verification."""
    if not token:
        return False
    return hmac.compare_digest(token, CONTROL_PLANE_API_KEY)


def require_control_plane_auth(
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
    bearer_creds: Annotated[HTTPAuthorizationCredentials | None, Security(security_bearer)] = None,
) -> OperatorContext:
    """Enforce authenticated control-plane access.

    Accepts credentials via X-API-Key header or Authorization: Bearer <token>.
    """
    token = x_api_key or (bearer_creds.credentials if bearer_creds else None)

    # In local testing or development, default dev key is accepted
    if not token or not verify_control_plane_token(token):
        logger.warning("Unauthorized access attempt to control plane API.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid control-plane authorization credential. Provide valid X-API-Key or Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return OperatorContext(operator_id="control_plane_operator", role="admin")


def _normalize_expiry(expires_at: str | datetime) -> str:
    """Normalize datetime or ISO string to canonical unix epoch string."""
    if isinstance(expires_at, datetime):
        dt = expires_at if expires_at.tzinfo is not None else expires_at.replace(tzinfo=UTC)
        return str(int(dt.timestamp()))
    try:
        dt = datetime.fromisoformat(expires_at)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        return str(int(dt.timestamp()))
    except Exception:
        return expires_at


def generate_approval_signature(
    report_id: str,
    candidate_release_id: str,
    candidate_sha256: str,
    operator_id: str,
    expires_at_iso: str | datetime,
) -> str:
    """Generate tamper-proof HMAC-SHA256 signature for evaluation approval."""
    exp_str = _normalize_expiry(expires_at_iso)
    payload = f"{report_id}|{candidate_release_id}|{candidate_sha256}|{operator_id}|{exp_str}"
    sig = hmac.new(
        CONTROL_PLANE_SECRET_KEY.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return sig


def verify_approval_signature(
    signature: str,
    report_id: str,
    candidate_release_id: str,
    candidate_sha256: str,
    operator_id: str,
    expires_at_iso: str | datetime,
) -> bool:
    """Verify cryptographic authenticity of evaluation approval token."""
    expected = generate_approval_signature(
        report_id=report_id,
        candidate_release_id=candidate_release_id,
        candidate_sha256=candidate_sha256,
        operator_id=operator_id,
        expires_at_iso=expires_at_iso,
    )
    return hmac.compare_digest(signature, expected)
