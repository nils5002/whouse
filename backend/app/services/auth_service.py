from __future__ import annotations

import importlib
import logging
from typing import Optional

from fastapi import HTTPException

from ..schemas.job import LoginRequest, LoginResponse

logger = logging.getLogger("cloud_web.auth")


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

