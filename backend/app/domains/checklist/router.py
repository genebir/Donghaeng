from typing import Annotated, Any

from fastapi import APIRouter, Query, status

from app.core.permissions import (
    ChecklistItemAdminContext,
    TeamAdminContext,
    TeamContext,
)
from app.deps import DbSession
from app.domains.checklist import service
from app.domains.checklist.models import ChecklistCategory, ChecklistStatus
from app.domains.checklist.schemas import (
    ChecklistItemCreate,
    ChecklistItemPublic,
    ChecklistItemUpdate,
)

# /api/v1/teams/{team_id}/checklist
nested_router = APIRouter(prefix="/teams/{team_id}/checklist", tags=["checklist"])

# /api/v1/checklist-items/{item_id}
flat_router = APIRouter(prefix="/checklist-items", tags=["checklist"])


def _to_dict(item: Any) -> dict[str, Any]:
    return ChecklistItemPublic.model_validate(item).model_dump(mode="json")


@nested_router.get("")
async def list_items(
    team: TeamContext,
    db: DbSession,
    category: Annotated[ChecklistCategory | None, Query()] = None,
    status_filter: Annotated[
        ChecklistStatus | None, Query(alias="status")
    ] = None,
) -> dict[str, Any]:
    items = await service.list_items(db, team.id, category, status_filter)
    return {"data": [_to_dict(i) for i in items]}


@nested_router.post("", status_code=status.HTTP_201_CREATED)
async def create_item(
    payload: ChecklistItemCreate, team: TeamAdminContext, db: DbSession
) -> dict[str, Any]:
    item = await service.create_item(db, team.id, payload)
    return {"data": _to_dict(item)}


@flat_router.patch("/{item_id}")
async def update_item(
    payload: ChecklistItemUpdate,
    item: ChecklistItemAdminContext,
    db: DbSession,
) -> dict[str, Any]:
    updated = await service.update_item(db, item, payload)
    return {"data": _to_dict(updated)}


@flat_router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item: ChecklistItemAdminContext, db: DbSession) -> None:
    await service.delete_item(db, item)
