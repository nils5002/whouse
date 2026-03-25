from __future__ import annotations

import importlib
import logging
import os
import sys
from pathlib import Path
from typing import List, Optional

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import SecretStr

from .models import (
    DefaultsResponse,
    JobStartResponse,
    JobStatus,
    LoginRequest,
    LoginResponse,
    SortConfig,
    TwoFactorPayload,
)
from .services.job_manager import JobManager
from .utils import default_file_types, detect_ocr_engines

CURRENT_FILE = Path(__file__).resolve()
CLOUD_PACKAGE = None
for base in CURRENT_FILE.parents:
    candidate = base / "cloud"
    if candidate.exists() and (candidate / "__init__.py").exists():
        CLOUD_PACKAGE = candidate
        break
if CLOUD_PACKAGE:
    package_root = str(CLOUD_PACKAGE.parent)
    if package_root not in sys.path:
        sys.path.append(package_root)


logger = logging.getLogger("cloud_web.auth")

app = FastAPI(title="iCloud Sorter Web API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

job_manager = JobManager()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/defaults", response_model=DefaultsResponse)
def get_defaults() -> DefaultsResponse:
    engines, details = detect_ocr_engines()
    config = SortConfig(
        apple_id="",
        apple_password=SecretStr(""),
        llm_api_base=os.environ.get("OPENAI_BASE_URL") or None,
        llm_api_key=SecretStr(os.environ["OPENAI_API_KEY"]) if os.environ.get("OPENAI_API_KEY") else None,
        model="gpt-4o-mini",
        dry_run=True,
        target_root="AutoSorted",
        max_pdf_pages=3,
        max_bytes_to_read=20000,
        file_types=default_file_types(),
        use_ocr=True,
        ocr_engine="auto" if engines and engines[0] != "none" else None,
        deep_analysis=False,
        request_timeout=30,
    )
    return DefaultsResponse(
        default_config=config,
        available_ocr_engines=engines,
        supports_easyocr=details.get("easyocr_available", False),
        supports_tesseract=details.get("tesseract_ready", False),
        default_file_types=default_file_types(),
    )


@app.post("/api/auth/login", response_model=LoginResponse)
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


@app.post("/api/jobs", response_model=JobStartResponse)
def start_job(config: SortConfig) -> JobStartResponse:
    try:
        job = job_manager.create_job(config)
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return JobStartResponse(job_id=job.id, status=job.status)


@app.get("/api/jobs/{job_id}", response_model=JobStatus)
def get_job_status(job_id: str) -> JobStatus:
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job nicht gefunden")
    return job.snapshot()


@app.post("/api/jobs/{job_id}/stop", response_model=JobStatus)
def stop_job(job_id: str) -> JobStatus:
    try:
        job = job_manager.stop_job(job_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return job.snapshot()


@app.post("/api/jobs/{job_id}/2fa", response_model=JobStatus)
def provide_two_factor(job_id: str, payload: TwoFactorPayload) -> JobStatus:
    if not payload.code:
        raise HTTPException(status_code=400, detail="2FA-Code fehlt")
    try:
        job = job_manager.provide_two_factor(job_id, payload.code)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return job.snapshot()


@app.get("/api/llm/models")
def list_llm_models(base: str, api_key: Optional[str] = None) -> dict[str, List[str]]:
    base = (base or "").strip().rstrip("/")
    if not base:
        raise HTTPException(status_code=400, detail="Parameter 'base' darf nicht leer sein")
    try:
        models = _fetch_llm_models(base, api_key or None)
    except requests.HTTPError as exc:
        status = exc.response.status_code if exc.response else 502
        raise HTTPException(status_code=status, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    if not models:
        raise HTTPException(status_code=404, detail="Keine Modelle gefunden")
    return {"models": models}


def _fetch_llm_models(base: str, api_key: Optional[str]) -> List[str]:
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    use_openai = (
        "/v1" in base
        or base.endswith("/models")
        or base.endswith("/chat")
        or base.endswith("/chat/completions")
    )
    if use_openai:
        url = base if base.endswith("/models") else f"{base}/models"
    else:
        if base.endswith("/api/tags"):
            url = base
        elif base.endswith("/api"):
            url = f"{base}/tags"
        else:
            url = f"{base}/api/tags"
    resp = requests.get(url, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    models: List[str] = []
    if isinstance(data, dict):
        if isinstance(data.get("data"), list):
            models.extend(
                str(item["id"]) for item in data["data"] if isinstance(item, dict) and item.get("id")
            )
        if not models and isinstance(data.get("models"), list):
            for entry in data["models"]:
                if isinstance(entry, dict):
                    value = entry.get("id") or entry.get("model") or entry.get("name")
                    if value:
                        models.append(str(value))
                elif isinstance(entry, str):
                    models.append(entry)
    if not models and isinstance(data, list):
        models = [str(x) for x in data]
    return sorted(dict.fromkeys(models))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)



