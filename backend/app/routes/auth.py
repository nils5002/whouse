from __future__ import annotations

from fastapi import APIRouter

from ..schemas.job import LoginRequest, LoginResponse
from ..services.auth_service import test_login

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    return test_login(payload)

