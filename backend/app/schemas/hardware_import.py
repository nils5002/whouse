from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class HardwareImportFileSummary(BaseModel):
    file_name: str
    rows_seen: int = 0
    rows_valid: int = 0
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: int = 0
    status: str = "processed"
    missing_columns: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class HardwareImportRowError(BaseModel):
    file_name: str
    sheet_name: str
    row_number: int
    serial_number: str | None = None
    reason: str
    raw_data: dict[str, Any] = Field(default_factory=dict)


class HardwareImportRunResponse(BaseModel):
    run_id: int
    status: str
    started_at: datetime
    finished_at: datetime | None = None
    import_path: str
    files_total: int = 0
    files_processed: int = 0
    rows_total: int = 0
    created_count: int = 0
    updated_count: int = 0
    skipped_count: int = 0
    error_count: int = 0
    details: dict[str, Any] = Field(default_factory=dict)
    errors: list[HardwareImportRowError] = Field(default_factory=list)

