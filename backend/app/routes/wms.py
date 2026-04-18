from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database.session import get_db
from ..schemas.wms import (
    ActivityItem,
    AssetItem,
    LocationItem,
    MaintenanceItem,
    ReservationItem,
    UserItem,
    WmsOverviewResponse,
)
from ..services.wms_service import WmsService

router = APIRouter(prefix="/api/wms", tags=["WMS"])


@router.get("/overview", response_model=WmsOverviewResponse)
def wms_overview(db: Session = Depends(get_db)) -> WmsOverviewResponse:
    return WmsService.overview(db)


@router.get("/assets", response_model=list[AssetItem])
def list_assets(db: Session = Depends(get_db)) -> list[AssetItem]:
    return WmsService.list_assets(db)


@router.get("/assets/{asset_id}", response_model=AssetItem)
def get_asset(asset_id: str, db: Session = Depends(get_db)) -> AssetItem:
    item = WmsService.get_asset(db, asset_id)
    if not item:
        raise HTTPException(status_code=404, detail="Asset nicht gefunden")
    return item


@router.post("/assets", response_model=AssetItem)
def upsert_asset(asset: AssetItem, db: Session = Depends(get_db)) -> AssetItem:
    return WmsService.upsert_asset(db, asset)


@router.delete("/assets/{asset_id}")
def delete_asset(asset_id: str, db: Session = Depends(get_db)) -> dict[str, bool]:
    return {"deleted": WmsService.delete_asset(db, asset_id)}


@router.get("/reservations", response_model=list[ReservationItem])
def list_reservations(db: Session = Depends(get_db)) -> list[ReservationItem]:
    return WmsService.list_reservations(db)


@router.post("/reservations", response_model=ReservationItem)
def upsert_reservation(reservation: ReservationItem, db: Session = Depends(get_db)) -> ReservationItem:
    return WmsService.upsert_reservation(db, reservation)


@router.delete("/reservations/{reservation_id}")
def delete_reservation(reservation_id: str, db: Session = Depends(get_db)) -> dict[str, bool]:
    return {"deleted": WmsService.delete_reservation(db, reservation_id)}


@router.get("/maintenance", response_model=list[MaintenanceItem])
def list_maintenance(db: Session = Depends(get_db)) -> list[MaintenanceItem]:
    return WmsService.list_maintenance(db)


@router.post("/maintenance", response_model=MaintenanceItem)
def upsert_maintenance(maintenance: MaintenanceItem, db: Session = Depends(get_db)) -> MaintenanceItem:
    return WmsService.upsert_maintenance(db, maintenance)


@router.delete("/maintenance/{maintenance_id}")
def delete_maintenance(maintenance_id: str, db: Session = Depends(get_db)) -> dict[str, bool]:
    return {"deleted": WmsService.delete_maintenance(db, maintenance_id)}


@router.get("/locations", response_model=list[LocationItem])
def list_locations(db: Session = Depends(get_db)) -> list[LocationItem]:
    return WmsService.list_locations(db)


@router.post("/locations", response_model=LocationItem)
def upsert_location(location: LocationItem, db: Session = Depends(get_db)) -> LocationItem:
    return WmsService.upsert_location(db, location)


@router.delete("/locations/{name}")
def delete_location(name: str, db: Session = Depends(get_db)) -> dict[str, bool]:
    return {"deleted": WmsService.delete_location(db, name)}


@router.get("/users", response_model=list[UserItem])
def list_users(db: Session = Depends(get_db)) -> list[UserItem]:
    return WmsService.list_users(db)


@router.post("/users", response_model=UserItem)
def upsert_user(user: UserItem, db: Session = Depends(get_db)) -> UserItem:
    return WmsService.upsert_user(db, user)


@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)) -> dict[str, bool]:
    return {"deleted": WmsService.delete_user(db, user_id)}


@router.get("/activities", response_model=list[ActivityItem])
def list_activities(db: Session = Depends(get_db)) -> list[ActivityItem]:
    return WmsService.list_activities(db)


@router.post("/activities", response_model=ActivityItem)
def upsert_activity(activity: ActivityItem, db: Session = Depends(get_db)) -> ActivityItem:
    return WmsService.upsert_activity(db, activity)


@router.delete("/activities/{activity_id}")
def delete_activity(activity_id: str, db: Session = Depends(get_db)) -> dict[str, bool]:
    return {"deleted": WmsService.delete_activity(db, activity_id)}

