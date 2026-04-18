from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class AssetRecord(TimestampMixin, Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    external_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(120), nullable=False)
    location: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[str] = mapped_column(String(64), nullable=False, default="Verfuegbar")
    assigned_to: Mapped[str] = mapped_column(String(120), nullable=False, default="-")
    next_return: Mapped[str] = mapped_column(String(120), nullable=False, default="-")
    tag_number: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    serial_number: Mapped[str] = mapped_column(String(128), nullable=False, unique=True, index=True)
    device_model: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    mac_lan: Mapped[str | None] = mapped_column(String(32), nullable=True)
    mac_wlan: Mapped[str | None] = mapped_column(String(32), nullable=True)
    qr_code: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    maintenance_state: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    last_checkout: Mapped[str] = mapped_column(String(120), nullable=False, default="-")
    next_reservation: Mapped[str] = mapped_column(String(120), nullable=False, default="-")
    source_file: Mapped[str | None] = mapped_column(String(255), nullable=True)


class ActivityRecord(TimestampMixin, Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    external_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(140), nullable=False)
    detail: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp_text: Mapped[str] = mapped_column(String(80), nullable=False)
    asset_external_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)


class ReservationRecord(TimestampMixin, Base):
    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    external_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    requested_by: Mapped[str] = mapped_column(String(120), nullable=False)
    team: Mapped[str] = mapped_column(String(120), nullable=False)
    period: Mapped[str] = mapped_column(String(120), nullable=False)
    assets: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(64), nullable=False, default="Angefragt")
    location: Mapped[str] = mapped_column(String(120), nullable=False)


class MaintenanceRecord(TimestampMixin, Base):
    __tablename__ = "maintenance_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    external_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    asset_name: Mapped[str] = mapped_column(String(255), nullable=False)
    issue: Mapped[str] = mapped_column(Text, nullable=False)
    reported_at: Mapped[str] = mapped_column(String(80), nullable=False)
    due_date: Mapped[str] = mapped_column(String(80), nullable=False)
    priority: Mapped[str] = mapped_column(String(32), nullable=False, default="Mittel")
    status: Mapped[str] = mapped_column(String(64), nullable=False, default="Offen")
    comment: Mapped[str] = mapped_column(Text, nullable=False, default="")
    location: Mapped[str] = mapped_column(String(120), nullable=False)


class LocationRecord(TimestampMixin, Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    capacity: Mapped[str] = mapped_column(String(64), nullable=False)
    assigned_assets: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    available_assets: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    manager: Mapped[str] = mapped_column(String(120), nullable=False)


class UserRecord(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    external_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(64), nullable=False, default="Mitarbeiter")
    last_active: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="Aktiv")
    department: Mapped[str | None] = mapped_column(String(120), nullable=True)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True)


class HardwareImportRunRecord(Base):
    __tablename__ = "hardware_import_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="running")
    import_path: Mapped[str] = mapped_column(String(255), nullable=False)
    files_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    files_processed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rows_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    skipped_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    details_json: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)


class HardwareImportRowErrorRecord(Base):
    __tablename__ = "hardware_import_row_errors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    run_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sheet_name: Mapped[str] = mapped_column(String(128), nullable=False, default="Sheet1")
    row_number: Mapped[int] = mapped_column(Integer, nullable=False)
    serial_number: Mapped[str | None] = mapped_column(String(128), nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    raw_data: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
