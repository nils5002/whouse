from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def test_login_and_me_roundtrip() -> None:
    client = TestClient(app)
    seeded = client.get("/api/wms/overview", headers={"X-User-Role": "Admin"})
    assert seeded.status_code == 200
    users = seeded.json().get("users") or []
    user = next((item for item in users if item.get("status") == "Aktiv"), None)
    if user is None:
        create_payload = {
            "id": "usr-auth-smoke",
            "name": "Auth Smoke",
            "email": "auth.smoke@example.local",
            "role": "Mitarbeiter",
            "lastActive": "Neu",
            "status": "Aktiv",
            "department": "QA",
            "location": "Berlin",
        }
        created = client.post("/api/wms/users", headers={"X-User-Role": "Admin"}, json=create_payload)
        assert created.status_code == 200
        user = created.json()

    login = client.post(
        "/api/auth/login",
        json={"identifier": user["email"], "password": "Willkommen123!"},
    )
    assert login.status_code == 200
    token = login.json()["accessToken"]
    assert token

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    payload = me.json()
    assert payload["email"].lower() == user["email"].lower()
    assert payload["userId"] == user["id"]


def test_protected_wms_endpoint_requires_auth() -> None:
    client = TestClient(app)
    unauthorized = client.get("/api/wms/overview")
    assert unauthorized.status_code == 401
