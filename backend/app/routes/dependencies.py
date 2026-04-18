from __future__ import annotations

from fastapi import HTTPException, Request

from ..services.job_manager import JobManager


def get_job_manager(request: Request) -> JobManager:
    manager = getattr(request.app.state, "job_manager", None)
    if manager is None:
        raise HTTPException(status_code=500, detail="Job manager is not initialized")
    return manager

