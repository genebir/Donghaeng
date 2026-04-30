from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Query, status

from app.core.permissions import (
    ScheduleItemAdminContext,
    TeamAdminContext,
    TeamContext,
)
from app.deps import DbSession
from app.domains.schedule import service
from app.domains.schedule.schemas import (
    ScheduleItemCreate,
    ScheduleItemPublic,
    ScheduleItemUpdate,
)

# /api/v1/teams/{team_id}/schedule
nested_router = APIRouter(prefix="/teams/{team_id}/schedule", tags=["schedule"])

# /api/v1/schedule-items/{item_id}
flat_router = APIRouter(prefix="/schedule-items", tags=["schedule"])


def _to_dict(item: Any) -> dict[str, Any]:
    return ScheduleItemPublic.model_validate(item).model_dump(mode="json")


@nested_router.get("")
async def list_items(
    team: TeamContext,
    db: DbSession,
    range_from: Annotated[datetime | None, Query(alias="from")] = None,
    range_to: Annotated[datetime | None, Query(alias="to")] = None,
) -> dict[str, Any]:
    items = await service.list_items(db, team.id, range_from, range_to)
    return {"data": [_to_dict(i) for i in items]}


@nested_router.post("", status_code=status.HTTP_201_CREATED)
async def create_item(
    payload: ScheduleItemCreate, team: TeamAdminContext, db: DbSession
) -> dict[str, Any]:
    item = await service.create_item(db, team.id, payload)
    return {"data": _to_dict(item)}


@flat_router.patch("/{item_id}")
async def update_item(
    payload: ScheduleItemUpdate,
    item: ScheduleItemAdminContext,
    db: DbSession,
) -> dict[str, Any]:
    updated = await service.update_item(db, item, payload)
    return {"data": _to_dict(updated)}


@flat_router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item: ScheduleItemAdminContext, db: DbSession) -> None:
    await service.delete_item(db, item)
