from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


AssetStatus = Literal[
    "Verfuegbar",
    "Verliehen",
    "In Wartung",
    "Defekt",
    "Reserviert",
    "Ausgegeben",
    "Unterwegs",
    "Verloren",
]
ReservationStatus = Literal["Angefragt", "Bestaetigt", "Aktiv", "Abgeschlossen", "Storniert"]
MaintenancePriority = Literal["Niedrig", "Mittel", "Hoch", "Kritisch"]
MaintenanceStatus = Literal[
    "Offen",
    "In Bearbeitung",
    "Erledigt",
    "In Arbeit",
    "Wartet auf Teile",
    "Abgeschlossen",
]
UserRole = Literal["Admin", "Mitarbeiter", "Lager / Logistik", "Event-Team", "Nur-Lesen"]
UserStatus = Literal["Aktiv", "Inaktiv", "Eingeschraenkt"]


class AssetItem(BaseModel):
    id: str
    name: str
    category: str
    location: str
    status: AssetStatus
    assignedTo: str
    nextReturn: str
    tagNumber: str
    serialNumber: str
    model: Optional[str] = None
    ipAddress: Optional[str] = None
    macLan: Optional[str] = None
    macWlan: Optional[str] = None
    qrCode: str = ""
    maintenanceState: str
    notes: str
    lastCheckout: str
    nextReservation: str
    sourceFile: Optional[str] = None


class ActivityItem(BaseModel):
    id: str
    title: str
    detail: str
    timestamp: str
    assetId: Optional[str] = None


class ReservationItem(BaseModel):
    id: str
    requestedBy: str
    team: str
    period: str
    assets: list[str]
    status: ReservationStatus
    location: str


class MaintenanceItem(BaseModel):
    id: str
    assetName: str
    issue: str
    reportedAt: str
    dueDate: str
    priority: MaintenancePriority
    status: MaintenanceStatus
    comment: str
    location: str


class LocationItem(BaseModel):
    name: str
    capacity: str
    assignedAssets: int
    availableAssets: int
    manager: str


class UserItem(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    lastActive: str
    status: UserStatus
    department: Optional[str] = None
    location: Optional[str] = None


class WmsOverviewResponse(BaseModel):
    assets: list[AssetItem] = Field(default_factory=list)
    activities: list[ActivityItem] = Field(default_factory=list)
    reservations: list[ReservationItem] = Field(default_factory=list)
    maintenanceItems: list[MaintenanceItem] = Field(default_factory=list)
    locations: list[LocationItem] = Field(default_factory=list)
    users: list[UserItem] = Field(default_factory=list)
