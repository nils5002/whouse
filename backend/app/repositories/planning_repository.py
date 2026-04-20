from __future__ import annotations

from collections import defaultdict
from datetime import date
from uuid import uuid4

from sqlalchemy import and_, case, delete, func, select
from sqlalchemy.orm import Session

from ..database.models import AssetRecord, PlanningDayRecord, PlanningItemRecord, PlanningRecord
from ..schemas.planning import (
    PlanningAvailabilityCategorySummary,
    PlanningAvailabilityItem,
    PlanningAvailabilityResponse,
    PlanningDayResponse,
    PlanningItemResponse,
    PlanningListItem,
    PlanningResponse,
    PlanningStatus,
    PlanningUpsertPayload,
)

ACTIVE_PLANNING_STATUSES = {"Geplant", "Bestaetigt"}


def _normalize_status(value: str | PlanningStatus) -> PlanningStatus:
    normalized = str(value).strip().lower()
    if normalized in {"entwurf", "draft"}:
        return "Entwurf"
    if normalized in {"geplant", "planned"}:
        return "Geplant"
    if normalized in {"bestaetigt", "bestätigt", "confirmed"}:
        return "Bestaetigt"
    if normalized in {"abgeschlossen", "closed", "done"}:
        return "Abgeschlossen"
    if normalized in {"storniert", "cancelled", "canceled"}:
        return "Storniert"
    return "Entwurf"


def _normalize_weekday(value: str | None, day_date: date) -> str:
    if value and value.strip():
        return value.strip()
    weekdays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
    return weekdays[day_date.weekday()]


def _generate_external_id(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:12]}"


def _planning_to_list_item(record: PlanningRecord) -> PlanningListItem:
    return PlanningListItem(
        id=record.external_id,
        customerName=record.customer_name,
        projectName=record.project_name,
        eventName=record.event_name,
        projectManagerUserId=record.project_manager_user_id,
        calendarWeek=record.calendar_week,
        startDate=record.start_date,
        endDate=record.end_date,
        status=_normalize_status(record.status),
        updatedAt=record.updated_at,
    )


def _planning_to_response(
    record: PlanningRecord,
    day_map: dict[int, list[PlanningItemRecord]],
    days: list[PlanningDayRecord],
) -> PlanningResponse:
    day_responses: list[PlanningDayResponse] = []
    for day in sorted(days, key=lambda item: item.planning_date):
        items = sorted(day_map.get(day.id, []), key=lambda item: item.category_key.lower())
        day_responses.append(
            PlanningDayResponse(
                id=day.id,
                planningDate=day.planning_date,
                weekday=day.weekday,
                items=[
                    PlanningItemResponse(
                        id=item.id,
                        categoryKey=item.category_key,
                        qty=item.qty,
                        notes=item.notes,
                    )
                    for item in items
                ],
            )
        )
    return PlanningResponse(
        id=record.external_id,
        customerName=record.customer_name,
        projectName=record.project_name,
        eventName=record.event_name,
        projectManagerUserId=record.project_manager_user_id,
        calendarWeek=record.calendar_week,
        startDate=record.start_date,
        endDate=record.end_date,
        notes=record.notes,
        status=_normalize_status(record.status),
        templateSourcePlanningId=record.template_source_planning_id,
        createdAt=record.created_at,
        updatedAt=record.updated_at,
        days=day_responses,
    )


def list_plannings(
    db: Session,
    status: str | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[PlanningListItem]:
    stmt = select(PlanningRecord).order_by(PlanningRecord.updated_at.desc())
    if status:
        stmt = stmt.where(PlanningRecord.status == _normalize_status(status))
    if from_date:
        stmt = stmt.where(PlanningRecord.end_date >= from_date)
    if to_date:
        stmt = stmt.where(PlanningRecord.start_date <= to_date)
    return [_planning_to_list_item(item) for item in db.scalars(stmt).all()]


def get_planning(db: Session, planning_id: str) -> PlanningResponse | None:
    planning = db.scalar(select(PlanningRecord).where(PlanningRecord.external_id == planning_id))
    if not planning:
        return None

    days = db.scalars(
        select(PlanningDayRecord).where(PlanningDayRecord.planning_id == planning.id)
    ).all()
    day_ids = [day.id for day in days]
    items = (
        db.scalars(select(PlanningItemRecord).where(PlanningItemRecord.planning_day_id.in_(day_ids))).all()
        if day_ids
        else []
    )
    day_map: dict[int, list[PlanningItemRecord]] = defaultdict(list)
    for item in items:
        day_map[item.planning_day_id].append(item)

    return _planning_to_response(planning, day_map, days)


def _upsert_days_and_items(db: Session, planning_pk: int, payload: PlanningUpsertPayload) -> None:
    existing_day_ids = db.scalars(
        select(PlanningDayRecord.id).where(PlanningDayRecord.planning_id == planning_pk)
    ).all()
    if existing_day_ids:
        db.execute(delete(PlanningItemRecord).where(PlanningItemRecord.planning_day_id.in_(existing_day_ids)))
        db.execute(delete(PlanningDayRecord).where(PlanningDayRecord.id.in_(existing_day_ids)))

    for day in sorted(payload.days, key=lambda item: item.planningDate):
        day_record = PlanningDayRecord(
            planning_id=planning_pk,
            planning_date=day.planningDate,
            weekday=_normalize_weekday(day.weekday, day.planningDate),
        )
        db.add(day_record)
        db.flush()
        for item in day.items:
            db.add(
                PlanningItemRecord(
                    planning_day_id=day_record.id,
                    category_key=item.categoryKey.strip(),
                    qty=item.qty,
                    notes=item.notes,
                )
            )


def upsert_planning(db: Session, payload: PlanningUpsertPayload, planning_id: str | None = None) -> PlanningResponse:
    resolved_id = planning_id or payload.id
    if resolved_id:
        planning = db.scalar(select(PlanningRecord).where(PlanningRecord.external_id == resolved_id))
    else:
        planning = None

    if planning is None:
        planning = PlanningRecord(
            external_id=resolved_id or _generate_external_id("pln"),
            customer_name=payload.customerName.strip(),
            project_name=payload.projectName.strip(),
            event_name=payload.eventName.strip() if payload.eventName else None,
            project_manager_user_id=payload.projectManagerUserId.strip() if payload.projectManagerUserId else None,
            calendar_week=payload.calendarWeek,
            start_date=payload.startDate,
            end_date=payload.endDate,
            notes=payload.notes.strip(),
            status=_normalize_status(payload.status),
        )
        db.add(planning)
        db.flush()
    else:
        planning.customer_name = payload.customerName.strip()
        planning.project_name = payload.projectName.strip()
        planning.event_name = payload.eventName.strip() if payload.eventName else None
        planning.project_manager_user_id = (
            payload.projectManagerUserId.strip() if payload.projectManagerUserId else None
        )
        planning.calendar_week = payload.calendarWeek
        planning.start_date = payload.startDate
        planning.end_date = payload.endDate
        planning.notes = payload.notes.strip()
        planning.status = _normalize_status(payload.status)

    _upsert_days_and_items(db, planning.id, payload)
    db.commit()
    return get_planning(db, planning.external_id)  # type: ignore[return-value]


def update_status(db: Session, planning_id: str, status: PlanningStatus) -> PlanningResponse | None:
    planning = db.scalar(select(PlanningRecord).where(PlanningRecord.external_id == planning_id))
    if not planning:
        return None
    planning.status = _normalize_status(status)
    db.commit()
    return get_planning(db, planning_id)


def duplicate_planning(db: Session, planning_id: str) -> PlanningResponse | None:
    source = get_planning(db, planning_id)
    if not source:
        return None

    payload = PlanningUpsertPayload(
        customerName=source.customerName,
        projectName=source.projectName,
        eventName=source.eventName,
        projectManagerUserId=source.projectManagerUserId,
        calendarWeek=source.calendarWeek,
        startDate=source.startDate,
        endDate=source.endDate,
        notes=source.notes,
        status="Entwurf",
        days=[
            {
                "planningDate": day.planningDate,
                "weekday": day.weekday,
                "items": [
                    {"categoryKey": item.categoryKey, "qty": item.qty, "notes": item.notes}
                    for item in day.items
                ],
            }
            for day in source.days
        ],
    )

    duplicated = upsert_planning(db, payload)
    record = db.scalar(select(PlanningRecord).where(PlanningRecord.external_id == duplicated.id))
    if record:
        record.template_source_planning_id = planning_id
        db.commit()
    return get_planning(db, duplicated.id)


def delete_planning(db: Session, planning_id: str) -> bool:
    planning = db.scalar(select(PlanningRecord).where(PlanningRecord.external_id == planning_id))
    if not planning:
        return False
    day_ids = db.scalars(select(PlanningDayRecord.id).where(PlanningDayRecord.planning_id == planning.id)).all()
    if day_ids:
        db.execute(delete(PlanningItemRecord).where(PlanningItemRecord.planning_day_id.in_(day_ids)))
        db.execute(delete(PlanningDayRecord).where(PlanningDayRecord.planning_id == planning.id))
    db.delete(planning)
    db.commit()
    return True


def _availability_state(requested_qty: int, remaining_qty: int) -> str:
    after_request = remaining_qty - requested_qty
    if after_request < 0:
        return "red"
    if after_request <= 2:
        return "yellow"
    return "green"


def get_planning_availability(db: Session, planning_id: str) -> PlanningAvailabilityResponse | None:
    planning = db.scalar(select(PlanningRecord).where(PlanningRecord.external_id == planning_id))
    if not planning:
        return None

    day_rows = db.scalars(select(PlanningDayRecord).where(PlanningDayRecord.planning_id == planning.id)).all()
    if not day_rows:
        return PlanningAvailabilityResponse(
            planningId=planning.external_id,
            periodStart=planning.start_date,
            periodEnd=planning.end_date,
            items=[],
            categorySummary=[],
        )

    day_ids = [day.id for day in day_rows]
    item_rows = db.scalars(select(PlanningItemRecord).where(PlanningItemRecord.planning_day_id.in_(day_ids))).all()
    if not item_rows:
        return PlanningAvailabilityResponse(
            planningId=planning.external_id,
            periodStart=planning.start_date,
            periodEnd=planning.end_date,
            items=[],
            categorySummary=[],
        )

    days_by_id = {day.id: day for day in day_rows}
    categories = sorted({item.category_key for item in item_rows})
    dates = sorted({days_by_id[item.planning_day_id].planning_date for item in item_rows})

    stock_rows = db.execute(
        select(
            AssetRecord.category,
            func.count(AssetRecord.id).label("total_stock"),
            func.sum(
                case(
                    (
                        and_(
                            func.lower(AssetRecord.status).not_like("%defekt%"),
                            func.lower(AssetRecord.status).not_like("%wartung%"),
                            func.lower(AssetRecord.status).not_like("%verlor%"),
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("usable_stock"),
        )
        .where(AssetRecord.category.in_(categories))
        .group_by(AssetRecord.category)
    ).all()
    stock_map = {
        str(row.category): (int(row.total_stock or 0), int(row.usable_stock or 0))
        for row in stock_rows
    }

    overlap_rows = db.execute(
        select(
            PlanningDayRecord.planning_date,
            PlanningItemRecord.category_key,
            func.sum(PlanningItemRecord.qty).label("already_planned_qty"),
        )
        .join(PlanningItemRecord, PlanningItemRecord.planning_day_id == PlanningDayRecord.id)
        .join(PlanningRecord, PlanningRecord.id == PlanningDayRecord.planning_id)
        .where(PlanningRecord.external_id != planning_id)
        .where(PlanningRecord.status.in_(tuple(ACTIVE_PLANNING_STATUSES)))
        .where(PlanningRecord.start_date <= planning.end_date)
        .where(PlanningRecord.end_date >= planning.start_date)
        .where(PlanningDayRecord.planning_date.in_(dates))
        .where(PlanningItemRecord.category_key.in_(categories))
        .group_by(PlanningDayRecord.planning_date, PlanningItemRecord.category_key)
    ).all()
    overlap_map = {
        (row.planning_date, str(row.category_key)): int(row.already_planned_qty or 0)
        for row in overlap_rows
    }

    availability_items: list[PlanningAvailabilityItem] = []
    summary_requested: dict[str, int] = defaultdict(int)
    summary_max_per_day: dict[str, int] = defaultdict(int)

    for item in sorted(item_rows, key=lambda row: (days_by_id[row.planning_day_id].planning_date, row.category_key)):
        day = days_by_id[item.planning_day_id]
        total_stock, usable_stock = stock_map.get(item.category_key, (0, 0))
        already_planned = overlap_map.get((day.planning_date, item.category_key), 0)
        remaining_qty = usable_stock - already_planned
        shortage_qty = max(0, item.qty - remaining_qty)
        availability_items.append(
            PlanningAvailabilityItem(
                planningDate=day.planning_date,
                weekday=day.weekday,
                categoryKey=item.category_key,
                requestedQty=item.qty,
                totalStock=total_stock,
                usableStock=usable_stock,
                alreadyPlanned=already_planned,
                remainingQty=remaining_qty,
                availabilityState=_availability_state(item.qty, remaining_qty),
                shortageQty=shortage_qty,
            )
        )
        summary_requested[item.category_key] += item.qty
        summary_max_per_day[item.category_key] = max(summary_max_per_day[item.category_key], item.qty)

    category_summary = [
        PlanningAvailabilityCategorySummary(
            categoryKey=category,
            requestedTotal=summary_requested[category],
            maxRequestedPerDay=summary_max_per_day[category],
            totalStock=stock_map.get(category, (0, 0))[0],
            usableStock=stock_map.get(category, (0, 0))[1],
        )
        for category in sorted(summary_requested)
    ]

    return PlanningAvailabilityResponse(
        planningId=planning.external_id,
        periodStart=planning.start_date,
        periodEnd=planning.end_date,
        items=availability_items,
        categorySummary=category_summary,
    )

