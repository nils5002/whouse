from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from ...database.models import AssetRecord


@dataclass(slots=True)
class ImporterAction:
    action: str
    record: AssetRecord | None = None
    reason: str | None = None


def upsert_asset_by_serial(
    db: Session,
    payload: dict[str, Any],
    *,
    dry_run: bool = False,
) -> ImporterAction:
    serial = payload["serial_number"]
    existing = db.scalar(select(AssetRecord).where(AssetRecord.serial_number == serial))
    if existing:
        if dry_run:
            updated = would_update(existing, payload)
            return ImporterAction(action="updated" if updated else "skipped", record=existing)
        updated = apply_update(existing, payload)
        if updated:
            db.add(existing)
            return ImporterAction(action="updated", record=existing)
        return ImporterAction(action="skipped", record=existing, reason="No changes")

    candidate_tag = payload["tag_number"]
    if db.scalar(select(AssetRecord.id).where(AssetRecord.tag_number == candidate_tag)):
        suffix = serial[-6:].upper().replace(" ", "")
        payload["tag_number"] = f"{candidate_tag[:24]}-{suffix}"[:32]

    if dry_run:
        return ImporterAction(action="created")

    record = AssetRecord(**payload)
    db.add(record)
    return ImporterAction(action="created", record=record)


def apply_update(record: AssetRecord, payload: dict[str, Any]) -> bool:
    changed = False
    for field in (
        "category",
        "location",
        "name",
        "device_model",
        "ip_address",
        "mac_lan",
        "mac_wlan",
        "status",
        "source_file",
    ):
        new_value = payload.get(field)
        if new_value and getattr(record, field) != new_value:
            setattr(record, field, new_value)
            changed = True

    if payload.get("notes") and payload["notes"] not in (record.notes or ""):
        merged_notes = (record.notes + "\n" + payload["notes"]).strip() if record.notes else payload["notes"]
        record.notes = merged_notes
        changed = True
    return changed


def would_update(record: AssetRecord, payload: dict[str, Any]) -> bool:
    for field in (
        "category",
        "location",
        "name",
        "device_model",
        "ip_address",
        "mac_lan",
        "mac_wlan",
        "status",
        "source_file",
    ):
        new_value = payload.get(field)
        if new_value and getattr(record, field) != new_value:
            return True
    if payload.get("notes") and payload["notes"] not in (record.notes or ""):
        return True
    return False
