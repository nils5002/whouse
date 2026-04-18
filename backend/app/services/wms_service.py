from __future__ import annotations

import logging
from pathlib import Path

from sqlalchemy.orm import Session

from ..repositories import wms_repository
from ..schemas.wms import (
    ActivityItem,
    AssetItem,
    LocationItem,
    MaintenanceItem,
    ReservationItem,
    UserItem,
    WmsOverviewResponse,
)

logger = logging.getLogger("cloud_web.wms")


class WmsService:
    """Domain orchestration for WMS data backed by the SQL database."""

    @staticmethod
    def overview(db: Session) -> WmsOverviewResponse:
        return wms_repository.get_overview(db)

    @staticmethod
    def list_assets(db: Session) -> list[AssetItem]:
        return wms_repository.list_assets(db)

    @staticmethod
    def get_asset(db: Session, asset_id: str) -> AssetItem | None:
        return wms_repository.get_asset(db, asset_id)

    @staticmethod
    def upsert_asset(db: Session, asset: AssetItem) -> AssetItem:
        return wms_repository.upsert_asset(db, asset)

    @staticmethod
    def delete_asset(db: Session, asset_id: str) -> bool:
        return wms_repository.delete_asset(db, asset_id)

    @staticmethod
    def list_reservations(db: Session) -> list[ReservationItem]:
        return wms_repository.list_reservations(db)

    @staticmethod
    def upsert_reservation(db: Session, reservation: ReservationItem) -> ReservationItem:
        return wms_repository.upsert_reservation(db, reservation)

    @staticmethod
    def delete_reservation(db: Session, reservation_id: str) -> bool:
        return wms_repository.delete_reservation(db, reservation_id)

    @staticmethod
    def list_maintenance(db: Session) -> list[MaintenanceItem]:
        return wms_repository.list_maintenance(db)

    @staticmethod
    def upsert_maintenance(db: Session, maintenance: MaintenanceItem) -> MaintenanceItem:
        return wms_repository.upsert_maintenance(db, maintenance)

    @staticmethod
    def delete_maintenance(db: Session, maintenance_id: str) -> bool:
        return wms_repository.delete_maintenance(db, maintenance_id)

    @staticmethod
    def list_locations(db: Session) -> list[LocationItem]:
        return wms_repository.list_locations(db)

    @staticmethod
    def upsert_location(db: Session, location: LocationItem) -> LocationItem:
        return wms_repository.upsert_location(db, location)

    @staticmethod
    def delete_location(db: Session, name: str) -> bool:
        return wms_repository.delete_location(db, name)

    @staticmethod
    def list_users(db: Session) -> list[UserItem]:
        return wms_repository.list_users(db)

    @staticmethod
    def upsert_user(db: Session, user: UserItem) -> UserItem:
        return wms_repository.upsert_user(db, user)

    @staticmethod
    def delete_user(db: Session, user_id: str) -> bool:
        return wms_repository.delete_user(db, user_id)

    @staticmethod
    def list_activities(db: Session) -> list[ActivityItem]:
        return wms_repository.list_activities(db)

    @staticmethod
    def upsert_activity(db: Session, activity: ActivityItem) -> ActivityItem:
        return wms_repository.upsert_activity(db, activity)

    @staticmethod
    def delete_activity(db: Session, activity_id: str) -> bool:
        return wms_repository.delete_activity(db, activity_id)

    @staticmethod
    def seed_from_legacy_json_if_needed(db: Session, legacy_path: Path) -> None:
        if wms_repository.has_wms_data(db):
            return
        result = wms_repository.seed_from_legacy_json(db, legacy_path)
        if result["created"] > 0:
            logger.info("WMS legacy seed imported %s records from %s", result["created"], legacy_path)

