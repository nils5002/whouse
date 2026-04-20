from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database.models import (
    ActivityRecord,
    AssetRecord,
    LocationRecord,
    MaintenanceRecord,
    ReservationRecord,
    UserRecord,
)
from ..schemas.wms import (
    ActivityItem,
    AssetItem,
    LocationItem,
    MaintenanceItem,
    ReservationItem,
    UserItem,
    WmsOverviewResponse,
)
from ..services.auth_service import DEFAULT_PASSWORD, hash_password


def _build_qr_code(asset_id: str, tag_number: str) -> str:
    return f"WMS|{asset_id}|{tag_number}"


def _normalize_asset_status(value: str | None) -> str:
    allowed = {
        "Verfuegbar",
        "Verliehen",
        "In Wartung",
        "Defekt",
        "Reserviert",
        "Ausgegeben",
        "Unterwegs",
        "Verloren",
    }
    if value in allowed:
        if value in {"Reserviert", "Ausgegeben", "Unterwegs"}:
            return "Verliehen"
        if value == "Verloren":
            return "Defekt"
        return value
    raw = (value or "").strip().lower()
    if raw in {"ok", "verfuegbar", "verfügbar", "frei", "available", "einsatzbereit"}:
        return "Verfuegbar"
    if "reserv" in raw or raw in {"ausgegeben", "entliehen", "in use", "checked out", "verliehen"}:
        return "Verliehen"
    if "unterwegs" in raw:
        return "Verliehen"
    if "wartung" in raw or "service" in raw:
        return "In Wartung"
    if "defekt" in raw or "kaputt" in raw or "verlor" in raw:
        return "Defekt"
    return "Verfuegbar"


def _normalize_user_role(value: str | None) -> str:
    raw = (value or "").strip().lower()
    if raw in {"admin", "techniker", "administrator"}:
        return "Admin"
    if raw in {"projektmanager", "projectmanager", "project manager"}:
        return "Projektmanager"
    if raw in {"junior"}:
        return "Junior"
    return "Mitarbeiter"


def _normalize_user_status(value: str | None) -> str:
    raw = (value or "").strip().lower()
    if raw in {"aktiv", "active"}:
        return "Aktiv"
    return "Inaktiv"


def _normalize_maintenance_status(value: str | None) -> str:
    raw = (value or "").strip().lower()
    if raw in {"offen", "open"}:
        return "Offen"
    if raw in {"in bearbeitung", "in arbeit", "wartet auf teile", "in progress"}:
        return "In Bearbeitung"
    if raw in {"erledigt", "abgeschlossen", "done", "closed"}:
        return "Erledigt"
    return "Offen"


def _asset_to_schema(record: AssetRecord) -> AssetItem:
    qr_code = record.qr_code.strip() or _build_qr_code(record.external_id, record.tag_number)
    return AssetItem(
        id=record.external_id,
        name=record.name,
        category=record.category,
        location=record.location,
        status=_normalize_asset_status(record.status),
        assignedTo=record.assigned_to,
        nextReturn=record.next_return,
        tagNumber=record.tag_number,
        serialNumber=record.serial_number,
        model=record.device_model,
        ipAddress=record.ip_address,
        macLan=record.mac_lan,
        macWlan=record.mac_wlan,
        qrCode=qr_code,
        maintenanceState=record.maintenance_state,
        notes=record.notes,
        lastCheckout=record.last_checkout,
        nextReservation=record.next_reservation,
        sourceFile=record.source_file,
    )


def _activity_to_schema(record: ActivityRecord) -> ActivityItem:
    return ActivityItem(
        id=record.external_id,
        title=record.title,
        detail=record.detail,
        timestamp=record.timestamp_text,
        assetId=record.asset_external_id,
    )


def _reservation_to_schema(record: ReservationRecord) -> ReservationItem:
    return ReservationItem(
        id=record.external_id,
        requestedBy=record.requested_by,
        team=record.team,
        period=record.period,
        assets=list(record.assets or []),
        status=record.status,
        location=record.location,
    )


def _maintenance_to_schema(record: MaintenanceRecord) -> MaintenanceItem:
    return MaintenanceItem(
        id=record.external_id,
        assetName=record.asset_name,
        issue=record.issue,
        reportedAt=record.reported_at,
        dueDate=record.due_date,
        priority=record.priority,
        status=_normalize_maintenance_status(record.status),
        comment=record.comment,
        location=record.location,
    )


def _location_to_schema(record: LocationRecord) -> LocationItem:
    return LocationItem(
        name=record.name,
        capacity=record.capacity,
        assignedAssets=record.assigned_assets,
        availableAssets=record.available_assets,
        manager=record.manager,
    )


def _user_to_schema(record: UserRecord) -> UserItem:
    return UserItem(
        id=record.external_id,
        name=record.name,
        email=record.email,
        role=_normalize_user_role(record.role),
        lastActive=record.last_active,
        status=_normalize_user_status(record.status),
        department=record.department,
        location=record.location,
    )


def list_assets(db: Session) -> list[AssetItem]:
    stmt = select(AssetRecord).order_by(AssetRecord.created_at.desc())
    return [_asset_to_schema(item) for item in db.scalars(stmt).all()]


def get_asset(db: Session, external_id: str) -> AssetItem | None:
    stmt = select(AssetRecord).where(AssetRecord.external_id == external_id)
    record = db.scalar(stmt)
    return _asset_to_schema(record) if record else None


def upsert_asset(db: Session, item: AssetItem) -> AssetItem:
    stmt = select(AssetRecord).where(AssetRecord.external_id == item.id)
    record = db.scalar(stmt)
    payload = {
        "name": item.name,
        "category": item.category,
        "location": item.location,
        "status": _normalize_asset_status(item.status),
        "assigned_to": item.assignedTo,
        "next_return": item.nextReturn,
        "tag_number": item.tagNumber,
        "serial_number": item.serialNumber,
        "device_model": item.model,
        "ip_address": item.ipAddress,
        "mac_lan": item.macLan,
        "mac_wlan": item.macWlan,
        "qr_code": item.qrCode or _build_qr_code(item.id, item.tagNumber),
        "maintenance_state": item.maintenanceState,
        "notes": item.notes,
        "last_checkout": item.lastCheckout,
        "next_reservation": item.nextReservation,
        "source_file": item.sourceFile,
    }
    if record:
        for key, value in payload.items():
            setattr(record, key, value)
    else:
        record = AssetRecord(external_id=item.id, **payload)
        db.add(record)
    db.commit()
    db.refresh(record)
    return _asset_to_schema(record)


def delete_asset(db: Session, external_id: str) -> bool:
    stmt = select(AssetRecord).where(AssetRecord.external_id == external_id)
    record = db.scalar(stmt)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def list_activities(db: Session) -> list[ActivityItem]:
    stmt = select(ActivityRecord).order_by(ActivityRecord.created_at.desc())
    return [_activity_to_schema(item) for item in db.scalars(stmt).all()]


def upsert_activity(db: Session, item: ActivityItem) -> ActivityItem:
    stmt = select(ActivityRecord).where(ActivityRecord.external_id == item.id)
    record = db.scalar(stmt)
    payload = {
        "title": item.title,
        "detail": item.detail,
        "timestamp_text": item.timestamp,
        "asset_external_id": item.assetId,
    }
    if record:
        for key, value in payload.items():
            setattr(record, key, value)
    else:
        record = ActivityRecord(external_id=item.id, **payload)
        db.add(record)
    db.commit()
    db.refresh(record)
    return _activity_to_schema(record)


def delete_activity(db: Session, external_id: str) -> bool:
    stmt = select(ActivityRecord).where(ActivityRecord.external_id == external_id)
    record = db.scalar(stmt)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def list_reservations(db: Session) -> list[ReservationItem]:
    stmt = select(ReservationRecord).order_by(ReservationRecord.created_at.desc())
    return [_reservation_to_schema(item) for item in db.scalars(stmt).all()]


def upsert_reservation(db: Session, item: ReservationItem) -> ReservationItem:
    stmt = select(ReservationRecord).where(ReservationRecord.external_id == item.id)
    record = db.scalar(stmt)
    payload = {
        "requested_by": item.requestedBy,
        "team": item.team,
        "period": item.period,
        "assets": item.assets,
        "status": item.status,
        "location": item.location,
    }
    if record:
        for key, value in payload.items():
            setattr(record, key, value)
    else:
        record = ReservationRecord(external_id=item.id, **payload)
        db.add(record)
    db.commit()
    db.refresh(record)
    return _reservation_to_schema(record)


def delete_reservation(db: Session, external_id: str) -> bool:
    stmt = select(ReservationRecord).where(ReservationRecord.external_id == external_id)
    record = db.scalar(stmt)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def list_maintenance(db: Session) -> list[MaintenanceItem]:
    stmt = select(MaintenanceRecord).order_by(MaintenanceRecord.created_at.desc())
    return [_maintenance_to_schema(item) for item in db.scalars(stmt).all()]


def upsert_maintenance(db: Session, item: MaintenanceItem) -> MaintenanceItem:
    stmt = select(MaintenanceRecord).where(MaintenanceRecord.external_id == item.id)
    record = db.scalar(stmt)
    payload = {
        "asset_name": item.assetName,
        "issue": item.issue,
        "reported_at": item.reportedAt,
        "due_date": item.dueDate,
        "priority": item.priority,
        "status": _normalize_maintenance_status(item.status),
        "comment": item.comment,
        "location": item.location,
    }
    if record:
        for key, value in payload.items():
            setattr(record, key, value)
    else:
        record = MaintenanceRecord(external_id=item.id, **payload)
        db.add(record)
    db.commit()
    db.refresh(record)
    return _maintenance_to_schema(record)


def delete_maintenance(db: Session, external_id: str) -> bool:
    stmt = select(MaintenanceRecord).where(MaintenanceRecord.external_id == external_id)
    record = db.scalar(stmt)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def list_locations(db: Session) -> list[LocationItem]:
    stmt = select(LocationRecord).order_by(LocationRecord.name.asc())
    return [_location_to_schema(item) for item in db.scalars(stmt).all()]


def upsert_location(db: Session, item: LocationItem) -> LocationItem:
    stmt = select(LocationRecord).where(LocationRecord.name == item.name)
    record = db.scalar(stmt)
    payload = {
        "capacity": item.capacity,
        "assigned_assets": item.assignedAssets,
        "available_assets": item.availableAssets,
        "manager": item.manager,
    }
    if record:
        for key, value in payload.items():
            setattr(record, key, value)
    else:
        record = LocationRecord(name=item.name, **payload)
        db.add(record)
    db.commit()
    db.refresh(record)
    return _location_to_schema(record)


def delete_location(db: Session, name: str) -> bool:
    stmt = select(LocationRecord).where(LocationRecord.name == name)
    record = db.scalar(stmt)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def list_users(db: Session) -> list[UserItem]:
    stmt = select(UserRecord).order_by(UserRecord.created_at.desc())
    return [_user_to_schema(item) for item in db.scalars(stmt).all()]


def upsert_user(db: Session, item: UserItem) -> UserItem:
    stmt = select(UserRecord).where(UserRecord.external_id == item.id)
    record = db.scalar(stmt)
    payload = {
        "name": item.name,
        "email": item.email,
        "role": _normalize_user_role(item.role),
        "last_active": item.lastActive,
        "status": _normalize_user_status(item.status),
        "department": item.department,
        "location": item.location,
    }
    if record:
        for key, value in payload.items():
            setattr(record, key, value)
    else:
        record = UserRecord(
            external_id=item.id,
            password_hash=hash_password(DEFAULT_PASSWORD),
            **payload,
        )
        db.add(record)
    db.commit()
    db.refresh(record)
    return _user_to_schema(record)


def delete_user(db: Session, external_id: str) -> bool:
    stmt = select(UserRecord).where(UserRecord.external_id == external_id)
    record = db.scalar(stmt)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def get_overview(db: Session) -> WmsOverviewResponse:
    return WmsOverviewResponse(
        assets=list_assets(db),
        activities=list_activities(db),
        reservations=list_reservations(db),
        maintenanceItems=list_maintenance(db),
        locations=list_locations(db),
        users=list_users(db),
    )


def has_wms_data(db: Session) -> bool:
    return db.scalar(select(AssetRecord.id).limit(1)) is not None


def seed_from_legacy_json(db: Session, legacy_path: Path) -> dict[str, int]:
    if not legacy_path.exists():
        return {"created": 0}
    payload = json.loads(legacy_path.read_text(encoding="utf-8"))
    overview = WmsOverviewResponse.model_validate(payload)

    created = 0
    for item in overview.assets:
        upsert_asset(db, item)
        created += 1
    for item in overview.activities:
        upsert_activity(db, item)
        created += 1
    for item in overview.reservations:
        upsert_reservation(db, item)
        created += 1
    for item in overview.maintenanceItems:
        upsert_maintenance(db, item)
        created += 1
    for item in overview.locations:
        upsert_location(db, item)
        created += 1
    for item in overview.users:
        upsert_user(db, item)
        created += 1
    return {"created": created}
