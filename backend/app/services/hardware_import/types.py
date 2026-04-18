from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


CANONICAL_COLUMNS = (
    "name",
    "inventory_number",
    "model",
    "description",
    "serial_number",
    "sim_number",
    "phone_number",
    "power_supply",
    "language",
    "ip_address",
    "mac_lan",
    "mac_wlan",
    "status",
)
REQUIRED_COLUMNS = ("name", "serial_number")


@dataclass(slots=True)
class ParsedExcelRow:
    file_name: str
    sheet_name: str
    row_number: int
    data: dict[str, Any]


@dataclass(slots=True)
class ParsedExcelFile:
    path: Path
    file_name: str
    sheet_name: str
    missing_required_columns: list[str] = field(default_factory=list)
    missing_optional_columns: list[str] = field(default_factory=list)
    rows: list[ParsedExcelRow] = field(default_factory=list)


@dataclass(slots=True)
class HardwareImportMappedRow:
    file_name: str
    sheet_name: str
    row_number: int
    serial_number: str
    payload: dict[str, Any]


@dataclass(slots=True)
class HardwareImportError:
    file_name: str
    sheet_name: str
    row_number: int
    reason: str
    serial_number: str | None = None
    raw_data: dict[str, Any] = field(default_factory=dict)
