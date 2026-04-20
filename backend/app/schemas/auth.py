from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


AppRole = Literal["Admin", "Projektmanager", "Mitarbeiter"]


class AuthLoginRequest(BaseModel):
    identifier: str = Field(..., min_length=1, description="E-Mail oder Benutzername")
    password: str = Field(..., min_length=1, description="Klartext-Passwort")


class AuthUserInfo(BaseModel):
    userId: str
    name: str
    email: str
    role: AppRole


class AuthLoginResponse(BaseModel):
    accessToken: str
    tokenType: Literal["bearer"] = "bearer"
    expiresIn: int
    user: AuthUserInfo
