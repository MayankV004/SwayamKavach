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
DEFAULT_TELEMETRY_KEY = "swayamkavach-telemetry-dev-key"
DEFAULT_LABELS_KEY = "swayamkavach-labels-dev-key"
DEFAULT_EVALUATION_KEY = "swayamkavach-evaluation-dev-key"
DEFAULT_APPROVAL_KEY = "swayamkavach-approval-dev-key"
DEFAULT_DEPLOYMENT_KEY = "swayamkavach-deployment-dev-key"

DEV_DEFAULT_KEYS = {
    "CONTROL_PLANE_API_KEY": DEFAULT_DEV_KEY,
    "CONTROL_PLANE_SECRET_KEY": DEFAULT_DEV_HMAC_SECRET,
    "TELEMETRY_API_KEY": DEFAULT_TELEMETRY_KEY,
    "LABELS_API_KEY": DEFAULT_LABELS_KEY,
    "EVALUATION_API_KEY": DEFAULT_EVALUATION_KEY,
    "APPROVAL_API_KEY": DEFAULT_APPROVAL_KEY,
    "DEPLOYMENT_API_KEY": DEFAULT_DEPLOYMENT_KEY,
}

ENV = os.getenv("ENVIRONMENT", os.getenv("SWAYAMKAVACH_ENV", "development")).strip().lower()


def validate_production_credential(env_var_name: str, value: str | None, default_dev_value: str) -> str:
    """Validate that a production credential is set, non-default, and sufficiently strong."""
    if not value:
        raise RuntimeError(
            f"Production security breach: {env_var_name} must be explicitly configured in production. "
            "Missing credentials are not permitted."
        )
    if value == default_dev_value:
        raise RuntimeError(
            f"Production security breach: {env_var_name} cannot use the default development key. "
            "Default development keys are strictly rejected in production."
        )
    if len(value) < 32:
        raise RuntimeError(
            f"Production security breach: {env_var_name} must be at least 32 characters in production. "
            f"Current length ({len(value)}) is insufficient for cryptographic safety."
        )
    return value


def load_auth_credentials(env: str | None = None) -> dict[str, str]:
    """Load and validate all control-plane and scoped credentials according to environment."""
    current_env = (env or os.getenv("ENVIRONMENT", os.getenv("SWAYAMKAVACH_ENV", "development"))).strip().lower()
    is_prod = current_env in ("production", "prod")

    credentials = {}
    for var_name, dev_val in DEV_DEFAULT_KEYS.items():
        raw_val = os.getenv(var_name)
        if is_prod:
            credentials[var_name] = validate_production_credential(var_name, raw_val, dev_val)
        else:
            credentials[var_name] = raw_val or dev_val
    return credentials


def validate_production_credentials(env: str = "production") -> dict[str, str]:
    """Validate all credentials for production environment."""
    return load_auth_credentials(env=env)


_creds = load_auth_credentials()
CONTROL_PLANE_API_KEY = _creds["CONTROL_PLANE_API_KEY"]
CONTROL_PLANE_SECRET_KEY = _creds["CONTROL_PLANE_SECRET_KEY"]
TELEMETRY_API_KEY = _creds["TELEMETRY_API_KEY"]
LABELS_API_KEY = _creds["LABELS_API_KEY"]
EVALUATION_API_KEY = _creds["EVALUATION_API_KEY"]
APPROVAL_API_KEY = _creds["APPROVAL_API_KEY"]
DEPLOYMENT_API_KEY = _creds["DEPLOYMENT_API_KEY"]

security_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class OperatorContext:
    """Validated operator identity and authorization scope."""

    operator_id: str
    role: str
    is_authenticated: bool = True
    permissions: tuple[str, ...] = ("admin",)

    def has_permission(self, permission: str) -> bool:
        return "admin" in self.permissions or permission in self.permissions


def resolve_operator(token: str | None) -> OperatorContext | None:
    """Resolve token to an OperatorContext with least-privilege permissions."""
    if not token:
        return None

    if hmac.compare_digest(token, CONTROL_PLANE_API_KEY):
        return OperatorContext(
            operator_id="admin_operator",
            role="admin",
            permissions=(
                "admin",
                "telemetry:write",
                "labels:write",
                "evaluation:run",
                "evaluation:approve",
                "deployment:manage",
                "lifecycle:reset",
            ),
        )

    if hmac.compare_digest(token, TELEMETRY_API_KEY):
        return OperatorContext(
            operator_id="telemetry_sensor",
            role="sensor",
            permissions=("telemetry:write",),
        )

    if hmac.compare_digest(token, LABELS_API_KEY):
        return OperatorContext(
            operator_id="label_curator",
            role="analyst",
            permissions=("labels:write",),
        )

    if hmac.compare_digest(token, EVALUATION_API_KEY):
        return OperatorContext(
            operator_id="evaluator",
            role="evaluator",
            permissions=("evaluation:run",),
        )

    if hmac.compare_digest(token, APPROVAL_API_KEY):
        return OperatorContext(
            operator_id="security_officer",
            role="approver",
            permissions=("evaluation:run", "evaluation:approve"),
        )

    if hmac.compare_digest(token, DEPLOYMENT_API_KEY):
        return OperatorContext(
            operator_id="deployment_manager",
            role="deployer",
            permissions=("deployment:manage",),
        )

    return None


def verify_control_plane_token(token: str | None) -> bool:
    """Constant-time token verification."""
    return resolve_operator(token) is not None


def require_control_plane_auth(
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
    bearer_creds: Annotated[HTTPAuthorizationCredentials | None, Security(security_bearer)] = None,
) -> OperatorContext:
    """Enforce authenticated control-plane access.

    Accepts credentials via X-API-Key header or Authorization: Bearer <token>.
    """
    token = x_api_key or (bearer_creds.credentials if bearer_creds else None)
    operator = resolve_operator(token)

    if operator is None:
        logger.warning("Unauthorized access attempt to control plane API.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid control-plane authorization credential. Provide valid X-API-Key or Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return operator


def require_permission(permission: str):
    """Dependency factory enforcing least-privilege permission check."""

    def dependency(
        operator: Annotated[OperatorContext, Security(require_control_plane_auth)],
    ) -> OperatorContext:
        if not operator.has_permission(permission):
            logger.warning(
                "Operator %s (role=%s) denied access: lacking permission '%s'",
                operator.operator_id,
                operator.role,
                permission,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: permission '{permission}' is required for this operation.",
            )
        return operator

    return dependency


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
