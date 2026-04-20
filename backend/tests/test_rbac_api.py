from __future__ import annotations

from datetime import date, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def _headers(role: str, user_id: str | None = None, project_context: str | None = None) -> dict[str, str]:
    headers = {"X-User-Role": role}
    if user_id:
        headers["X-User-Id"] = user_id
    if project_context:
        headers["X-Project-Context"] = project_context
    return headers


def test_admin_can_manage_users_but_projectmanager_cannot() -> None:
    client = TestClient(app)
    suffix = uuid4().hex[:8]
    payload = {
        "id": f"usr-rbac-{suffix}",
        "name": f"RBAC User {suffix}",
        "email": f"rbac.{suffix}@example.local",
        "role": "Mitarbeiter",
        "lastActive": "Neu",
        "status": "Aktiv",
        "department": "QA",
        "location": "Berlin",
    }

    admin_res = client.post("/api/wms/users", headers=_headers("Admin"), json=payload)
    assert admin_res.status_code == 200

    denied_res = client.post("/api/wms/users", headers=_headers("Projektmanager"), json=payload)
    assert denied_res.status_code == 403


def test_mitarbeiter_can_checkout_but_not_modify_asset_masterdata() -> None:
    client = TestClient(app)
    overview = client.get("/api/wms/overview", headers=_headers("Admin"))
    assert overview.status_code == 200
    assets = overview.json()["assets"]
    assert assets, "Test benötigt mindestens ein Asset"
    asset = next(
        (
            item
            for item in assets
            if str(item.get("status", "")).lower() in {"verfuegbar", "verfügbar"}
        ),
        None,
    )
    if asset is None:
        suffix = uuid4().hex[:8]
        payload = {
            "id": f"asset-rbac-checkout-{suffix}",
            "name": f"Checkout Probe {suffix}",
            "category": "Notebook",
            "location": "Testlager",
            "status": "Verfuegbar",
            "assignedTo": "-",
            "nextReturn": "-",
            "tagNumber": f"TAG-CHK-{suffix}",
            "serialNumber": f"SN-CHK-{suffix}",
            "qrCode": "",
            "maintenanceState": "Neu",
            "notes": "",
            "lastCheckout": "-",
            "nextReservation": "-",
        }
        created = client.post("/api/wms/assets", headers=_headers("Admin"), json=payload)
        assert created.status_code == 200
        asset = created.json()

    checkout_payload = {
        **asset,
        "status": "Verliehen",
        "assignedTo": "Mitarbeiter Test · Projekt RBAC",
        "nextReturn": "morgen",
    }
    checkout_res = client.post("/api/wms/assets", headers=_headers("Mitarbeiter"), json=checkout_payload)
    assert checkout_res.status_code == 200

    blocked_payload = {**checkout_payload, "name": f"{asset['name']} (hacked)"}
    blocked_res = client.post("/api/wms/assets", headers=_headers("Mitarbeiter"), json=blocked_payload)
    assert blocked_res.status_code == 403


def test_only_admin_can_delete_asset() -> None:
    client = TestClient(app)
    suffix = uuid4().hex[:8]
    payload = {
        "id": f"asset-rbac-{suffix}",
        "name": f"Delete Probe {suffix}",
        "category": "Notebook",
        "location": "Testlager",
        "status": "Verfuegbar",
        "assignedTo": "-",
        "nextReturn": "-",
        "tagNumber": f"TAG-{suffix}",
        "serialNumber": f"SN-{suffix}",
        "qrCode": "",
        "maintenanceState": "Neu",
        "notes": "",
        "lastCheckout": "-",
        "nextReservation": "-",
    }
    create_res = client.post("/api/wms/assets", headers=_headers("Admin"), json=payload)
    assert create_res.status_code == 200

    denied = client.delete(f"/api/wms/assets/{payload['id']}", headers=_headers("Mitarbeiter"))
    assert denied.status_code == 403

    allowed = client.delete(f"/api/wms/assets/{payload['id']}", headers=_headers("Admin"))
    assert allowed.status_code == 200


def test_planning_permissions_and_project_scope() -> None:
    client = TestClient(app)
    suffix = uuid4().hex[:6]
    today = date.today()
    payload = {
        "customerName": f"Kunde RBAC {suffix}",
        "projectName": f"Projekt RBAC {suffix}",
        "eventName": "E2E RBAC",
        "projectManagerUserId": f"pm-{suffix}",
        "calendarWeek": today.isocalendar().week,
        "startDate": today.isoformat(),
        "endDate": (today + timedelta(days=1)).isoformat(),
        "notes": "RBAC Testplanung",
        "status": "Entwurf",
        "days": [
            {
                "planningDate": today.isoformat(),
                "weekday": "Montag",
                "items": [{"categoryKey": "Laptop", "qty": 1, "notes": None}],
            }
        ],
    }

    denied_create = client.post("/api/wms/planning", headers=_headers("Mitarbeiter"), json=payload)
    assert denied_create.status_code == 403

    created = client.post(
        "/api/wms/planning",
        headers=_headers("Projektmanager", user_id=f"pm-{suffix}"),
        json=payload,
    )
    assert created.status_code == 200
    planning_id = created.json()["id"]

    no_scope_list = client.get("/api/wms/planning", headers=_headers("Mitarbeiter"))
    assert no_scope_list.status_code == 403

    scoped_list = client.get("/api/wms/planning", headers=_headers("Mitarbeiter", project_context=f"Projekt RBAC {suffix}"))
    assert scoped_list.status_code == 200
    assert any(item["id"] == planning_id for item in scoped_list.json())

    cleanup = client.delete(f"/api/wms/planning/{planning_id}", headers=_headers("Admin"))
    assert cleanup.status_code == 200
