from __future__ import annotations

import ipaddress
import re
from typing import Any

MAC_PATTERN = re.compile(r"^[0-9A-F]{12}$", re.IGNORECASE)


def validate_row(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []

    name = clean_text(data.get("name"))
    serial = clean_text(data.get("serial_number"))

    if not name:
        errors.append("Pflichtfeld 'Name' fehlt.")
    if not serial:
        errors.append("Pflichtfeld 'Seriennummer' fehlt.")

    return errors


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, int):
        text = str(value)
    elif isinstance(value, float):
        if value.is_integer():
            text = str(int(value))
        else:
            text = format(value, "f").rstrip("0").rstrip(".")
    else:
        text = str(value)
    normalized = text.strip()
    if normalized.lower() in {"-", "--", "n/a", "na", "none", "null", "usb"}:
        return ""
    return normalized


def is_valid_ip(value: str) -> bool:
    try:
        ipaddress.ip_address(value)
        return True
    except ValueError:
        return False


def is_valid_mac(value: str) -> bool:
    compact = re.sub(r"[^0-9A-Fa-f]", "", value)
    return bool(MAC_PATTERN.fullmatch(compact))
