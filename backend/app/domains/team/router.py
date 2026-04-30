from typing import Any

from fastapi import APIRouter, status

from app.core.permissions import (
    OutreachAdminContext,
    TeamAdminContext,
    TeamContext,
)
from app.deps import DbSession
from app.domains.team import service
from app.domains.team.schemas import (
    DestinationPublic,
    DestinationUpsert,
    TeamCreate,
    TeamDetail,
    TeamPublic,
    TeamUpdate,
)

# /api/v1/outreaches/{outreach_id}/teams
nested_router = APIRouter(
    prefix="/outreaches/{outreach_id}/teams",
    tags=["team"],
)

# /api/v1/teams/{team_id}
flat_router = APIRouter(prefix="/teams", tags=["team"])


@nested_router.post("", status_code=status.HTTP_201_CREATED)
async def create_team(
    payload: TeamCreate, outreach: OutreachAdminContext, db: DbSession
) -> dict[str, Any]:
    team = await service.create_team(db, outreach.id, payload)
    return {"data": TeamPublic.model_validate(team).model_dump(mode="json")}


@flat_router.get("/{team_id}")
async def get_team(team: TeamContext, db: DbSession) -> dict[str, Any]:
    destination = await service.get_destination(db, team.id)
    detail = TeamDetail.model_validate(
        {
            **TeamPublic.model_validate(team).model_dump(),
            "destination": (
                DestinationPublic.model_validate(destination).model_dump()
                if destination
                else None
            ),
        }
    )
    return {"data": detail.model_dump(mode="json")}


@flat_router.patch("/{team_id}")
async def update_team(
    payload: TeamUpdate, team: TeamAdminContext, db: DbSession
) -> dict[str, Any]:
    updated = await service.update_team(db, team.id, payload)
    return {"data": TeamPublic.model_validate(updated).model_dump(mode="json")}


@flat_router.post(
    "/{team_id}/destination", status_code=status.HTTP_200_OK
)
async def upsert_destination(
    payload: DestinationUpsert, team: TeamAdminContext, db: DbSession
) -> dict[str, Any]:
    destination = await service.upsert_destination(db, team.id, payload)
    return {
        "data": DestinationPublic.model_validate(destination).model_dump(mode="json")
    }
