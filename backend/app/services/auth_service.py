from __future__ import annotations

import base64
import hashlib
import hmac
import importlib
import json
import logging
import secrets
from datetime import UTC, datetime, timedelta
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config.settings import get_settings
from ..database.models import UserRecord
from ..schemas.auth import AuthUserInfo
from ..schemas.job import LoginRequest, LoginResponse

logger = logging.getLogger("cloud_web.auth")
PASSWORD_ITERATIONS = 120_000
AUTH_TOKEN_EXPIRY_SECONDS = 60 * 60 * 12
DEFAULT_PASSWORD = "Willkommen123!"


def test_login(payload: LoginRequest) -> LoginResponse:
    sorter = importlib.import_module("cloud.cloud")
    password = payload.apple_password.get_secret_value()
    two_factor_code = (payload.two_factor_code or "").strip()

    class _TwoFactorRequired(Exception):
        pass

    pending_prompt: dict[str, Optional[str]] = {"text": None}
    original_input = getattr(sorter, "input", input)

    def _input(prompt: Optional[str] = None) -> str:
        if prompt:
            pending_prompt["text"] = prompt
        if two_factor_code:
            return two_factor_code
        raise _TwoFactorRequired()

    try:
        sorter.input = _input
        api = sorter.connect_icloud(payload.apple_id, password)
        trusted = bool(getattr(api, "is_trusted_session", False))
        return LoginResponse(
            success=True,
            two_factor_required=False,
            trusted_session=trusted,
            message="Anmeldung erfolgreich.",
        )
    except _TwoFactorRequired:
        message = (pending_prompt.get("text") or "Zwei-Faktor-Code erforderlich.").strip()
        return LoginResponse(
            success=False,
            two_factor_required=True,
            trusted_session=False,
            message=message or "Zwei-Faktor-Code erforderlich.",
        )
    except RuntimeError as exc:
        message = str(exc).strip() or "Apple-Login fehlgeschlagen."
        return LoginResponse(
            success=False,
            two_factor_required=False,
            trusted_session=False,
            message=message,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Login fehlgeschlagen")
        raise HTTPException(status_code=502, detail=str(exc) or "Login fehlgeschlagen") from exc
    finally:
        sorter.input = original_input


def _urlsafe_b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _urlsafe_b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def normalize_user_role(value: str | None) -> str:
    raw = (value or "").strip().lower()
    if raw in {"admin", "techniker", "administrator"}:
        return "Admin"
    if raw in {"projektmanager", "projectmanager", "project manager"}:
        return "Projektmanager"
    return "Mitarbeiter"


def hash_password(password: str, *, salt: str | None = None) -> str:
    resolved_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        resolved_salt.encode("utf-8"),
        PASSWORD_ITERATIONS,
    ).hex()
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${resolved_salt}${digest}"


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    try:
        algorithm, iterations, salt, expected_digest = password_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            int(iterations),
        ).hex()
        return hmac.compare_digest(digest, expected_digest)
    except Exception:  # noqa: BLE001
        return False


def _auth_secret() -> str:
    settings = get_settings()
    return settings.auth_token_secret


def issue_access_token(user: AuthUserInfo, *, expires_in: int = AUTH_TOKEN_EXPIRY_SECONDS) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": user.userId,
        "role": user.role,
        "name": user.name,
        "email": user.email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=expires_in)).timestamp()),
    }
    payload_raw = json.dumps(payload, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    payload_part = _urlsafe_b64encode(payload_raw)
    signature = hmac.new(_auth_secret().encode("utf-8"), payload_part.encode("utf-8"), hashlib.sha256).digest()
    signature_part = _urlsafe_b64encode(signature)
    return f"{payload_part}.{signature_part}"


def decode_access_token(token: str) -> AuthUserInfo:
    try:
        payload_part, signature_part = token.split(".", 1)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Ungültiger Auth-Token.") from exc
    expected_signature = hmac.new(
        _auth_secret().encode("utf-8"),
        payload_part.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    actual_signature = _urlsafe_b64decode(signature_part)
    if not hmac.compare_digest(expected_signature, actual_signature):
        raise HTTPException(status_code=401, detail="Ungültige Token-Signatur.")
    payload = json.loads(_urlsafe_b64decode(payload_part).decode("utf-8"))
    now_ts = int(datetime.now(UTC).timestamp())
    if int(payload.get("exp", 0)) < now_ts:
        raise HTTPException(status_code=401, detail="Session abgelaufen. Bitte erneut einloggen.")
    return AuthUserInfo(
        userId=str(payload.get("sub", "")).strip(),
        name=str(payload.get("name", "")).strip(),
        email=str(payload.get("email", "")).strip(),
        role=normalize_user_role(payload.get("role")),
    )


def ensure_user_passwords(db: Session) -> None:
    users = db.scalars(select(UserRecord)).all()
    changed = False
    for user in users:
        if user.password_hash:
            continue
        user.password_hash = hash_password(DEFAULT_PASSWORD)
        changed = True
    if changed:
        db.commit()
        logger.info("Default passwort gesetzt für %s Benutzer (nur fehlende Hashes).", len(users))


def authenticate_user(db: Session, identifier: str, password: str) -> AuthUserInfo:
    needle = identifier.strip().lower()
    if not needle:
        raise HTTPException(status_code=401, detail="Ungültige Zugangsdaten.")
    user = db.scalar(select(UserRecord).where(UserRecord.email.ilike(needle)))
    if user is None:
        user = db.scalar(select(UserRecord).where(UserRecord.external_id.ilike(needle)))
    if user is None:
        user = db.scalar(select(UserRecord).where(UserRecord.name.ilike(identifier.strip())))
    if user is None or user.status.lower() != "aktiv":
        raise HTTPException(status_code=401, detail="Ungültige Zugangsdaten.")
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Ungültige Zugangsdaten.")
    user.last_active = datetime.now(UTC).strftime("%d.%m.%Y %H:%M")
    db.commit()
    return AuthUserInfo(
        userId=user.external_id,
        name=user.name,
        email=user.email,
        role=normalize_user_role(user.role),
    )
