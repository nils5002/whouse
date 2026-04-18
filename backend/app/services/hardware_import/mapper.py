from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any

from .categorizer import (
    CATEGORY_HANDHELDS,
    CATEGORY_IPADS,
    CATEGORY_LTE_ROUTERS,
    CATEGORY_QR_SCANNERS,
    CATEGORY_ROUTERS,
    categorize_hardware,
)
from .types import HardwareImportMappedRow, ParsedExcelRow
from .validator import clean_text, is_valid_ip, is_valid_mac


def map_excel_row_to_asset(row: ParsedExcelRow) -> HardwareImportMappedRow:
    raw_name = clean_text(row.data.get("name"))
    inventory_number = clean_text(row.data.get("inventory_number"))
    device_model = clean_text(row.data.get("model")) or None
    description = clean_text(row.data.get("description")) or None
    serial_candidate = clean_text(row.data.get("serial_number"))
    sim_number = clean_text(row.data.get("sim_number"))
    phone_number = clean_text(row.data.get("phone_number"))
    power_supply = clean_text(row.data.get("power_supply"))
    language = clean_text(row.data.get("language"))

    category = categorize_hardware(
        file_name=row.file_name,
        name=raw_name or inventory_number,
        model=device_model,
        description=description,
    )
    name = derive_device_name(
        category=category,
        file_name=row.file_name,
        row_number=row.row_number,
        raw_name=raw_name,
        inventory_number=inventory_number,
        model=device_model,
    )
    serial = normalize_serial(serial_candidate or sim_number)
    external_id = f"asset-{uuid.uuid5(uuid.NAMESPACE_DNS, serial).hex[:12]}"
    tag_number = build_tag_number(serial, inventory_number=inventory_number)

    ip_address = clean_text(row.data.get("ip_address")) or None
    if ip_address and not is_valid_ip(ip_address):
        ip_address = None

    mac_lan = normalize_mac(clean_text(row.data.get("mac_lan"))) or None
    if mac_lan and not is_valid_mac(mac_lan):
        mac_lan = None

    mac_wlan = normalize_mac(clean_text(row.data.get("mac_wlan"))) or None
    if mac_wlan and not is_valid_mac(mac_wlan):
        mac_wlan = None

    status = normalize_import_status(clean_text(row.data.get("status")))
    location = infer_location(row.file_name)
    qr_code = f"WMS|{external_id}|{tag_number}"

    row_warnings_raw = row.data.get("_row_warnings")
    row_warnings = []
    if isinstance(row_warnings_raw, list):
        row_warnings = [clean_text(item) for item in row_warnings_raw if clean_text(item)]
    notes = build_notes(
        file_name=row.file_name,
        description=description,
        sim_number=sim_number or None,
        phone_number=phone_number or None,
        power_supply=power_supply or None,
        language=language or None,
        row_warnings=row_warnings,
    )

    payload: dict[str, Any] = {
        "external_id": external_id,
        "name": name,
        "category": category,
        "location": location,
        "status": status,
        "assigned_to": "-",
        "next_return": "-",
        "tag_number": tag_number,
        "serial_number": serial,
        "device_model": device_model,
        "ip_address": ip_address,
        "mac_lan": mac_lan,
        "mac_wlan": mac_wlan,
        "qr_code": qr_code,
        "maintenance_state": "Importiert",
        "notes": notes,
        "last_checkout": "-",
        "next_reservation": "-",
        "source_file": row.file_name,
    }
    return HardwareImportMappedRow(
        file_name=row.file_name,
        sheet_name=row.sheet_name,
        row_number=row.row_number,
        serial_number=serial,
        payload=payload,
    )


def derive_device_name(
    *,
    category: str,
    file_name: str,
    row_number: int,
    raw_name: str,
    inventory_number: str,
    model: str | None,
) -> str:
    fallback_id = inventory_number or str(row_number)
    stem = Path(file_name).stem.lower()
    synthetic_name = raw_name.lower().startswith(f"{stem}-")
    usable_name = "" if synthetic_name else raw_name
    is_numeric_name = usable_name.isdigit()

    if category == CATEGORY_IPADS:
        if usable_name and not is_numeric_name:
            return usable_name
        return f"iPad {fallback_id}"

    if category == CATEGORY_HANDHELDS:
        if usable_name and not is_numeric_name:
            return usable_name
        return f"Handheld {fallback_id}"

    if category in {CATEGORY_QR_SCANNERS, CATEGORY_LTE_ROUTERS, CATEGORY_ROUTERS} and usable_name:
        return usable_name

    if usable_name and not is_numeric_name:
        return usable_name

    if model and fallback_id:
        return f"{model} {fallback_id}"

    return f"{Path(file_name).stem[:30]} {fallback_id}".strip()


def normalize_serial(serial: str) -> str:
    return " ".join(serial.strip().split())


def normalize_mac(value: str) -> str:
    compact = "".join(ch for ch in value.strip().upper() if ch in "0123456789ABCDEF")
    if len(compact) == 12:
        return ":".join(compact[i : i + 2] for i in range(0, 12, 2))
    return value.strip().upper()


def build_tag_number(serial: str, *, inventory_number: str) -> str:
    seed = serial
    if not seed:
        seed = inventory_number
    clean = "".join(ch for ch in seed.upper() if ch.isalnum())
    if not clean:
        clean = uuid.uuid4().hex[:10].upper()
    return f"IMP-{clean[:20]}"


def build_notes(
    *,
    file_name: str,
    description: str | None = None,
    sim_number: str | None = None,
    phone_number: str | None = None,
    power_supply: str | None = None,
    language: str | None = None,
    row_warnings: list[str] | None = None,
) -> str:
    lines = [f"Importiert aus Excel-Datei: {file_name}"]
    if description:
        lines.append(f"Beschreibung: {description}")
    if sim_number:
        lines.append(f"SIM-Kartennummer: {sim_number}")
    if phone_number:
        lines.append(f"Rufnummer: {phone_number}")
    if power_supply:
        lines.append(f"Netzteil: {power_supply}")
    if language:
        lines.append(f"Sprache: {language}")
    if row_warnings:
        lines.append(f"Import-Hinweise: {'; '.join(row_warnings)}")
    return "\n".join(lines)


def normalize_import_status(status: str) -> str:
    value = status.strip().lower()
    if not value:
        return "Verfuegbar"

    if value in {"ok", "verfuegbar", "verfügbar", "frei", "available", "einsatzbereit"}:
        return "Verfuegbar"
    if value in {"verliehen", "ausgegeben", "entliehen", "in use", "checked out", "unterwegs"}:
        return "Verliehen"
    if "defekt" in value or "kaputt" in value:
        return "Defekt"
    if "wartung" in value or "service" in value or "testgerät" in value:
        return "In Wartung"
    return "Verfuegbar"


def infer_location(file_name: str) -> str:
    normalized = file_name.lower()
    if normalized.startswith("event_"):
        return "Eventlager"
    if "genolive" in normalized:
        return "Genolive Lager"
    return "Hauptlager"
