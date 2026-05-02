from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.permissions import TeamAccessContext
from app.deps import DbSession
from app.domains.home_update import service
from app.domains.home_update.models import HomeUpdate
from app.domains.home_update.schemas import (
    HomeUpdateCreate,
    HomeUpdatePublic,
    HomeUpdateUpdate,
)

# /api/v1/teams/{team_id}/home-updates
nested_router = APIRouter(
    prefix="/teams/{team_id}/home-updates", tags=["home-update"]
)

# /api/v1/share/{slug}
public_router = APIRouter(prefix="/share", tags=["home-update"], include_in_schema=True)


def _to_dict(home_update: Any) -> dict[str, Any]:
    return HomeUpdatePublic.model_validate(home_update).model_dump(mode="json")


async def _get_update_for_team(
    db: DbSession, update_id: UUID, team_id: UUID
) -> HomeUpdate:
    update = (
        await db.execute(
            select(HomeUpdate).where(
                HomeUpdate.id == update_id,
                HomeUpdate.team_id == team_id,
            )
        )
    ).scalar_one_or_none()
    if update is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="업데이트를 찾을 수 없습니다.",
        )
    return update


@nested_router.get("")
async def list_home_updates(
    access: TeamAccessContext, db: DbSession
) -> dict[str, Any]:
    updates = await service.list_team_updates(
        db, access.team.id, include_drafts=access.is_admin
    )
    return {"data": [_to_dict(u) for u in updates]}


@nested_router.post("", status_code=status.HTTP_201_CREATED)
async def create_home_update(
    payload: HomeUpdateCreate, access: TeamAccessContext, db: DbSession
) -> dict[str, Any]:
    if not access.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="팀 관리 권한이 필요합니다.")
    home_update = await service.create(
        db, access.team.id, payload, author_user_id=access.user_id
    )
    return {"data": _to_dict(home_update)}


@nested_router.get("/{update_id}")
async def get_home_update(
    update_id: UUID, access: TeamAccessContext, db: DbSession
) -> dict[str, Any]:
    if not access.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="팀 관리 권한이 필요합니다.")
    home_update = await _get_update_for_team(db, update_id, access.team.id)
    return {"data": _to_dict(home_update)}


@nested_router.patch("/{update_id}")
async def update_home_update(
    update_id: UUID,
    payload: HomeUpdateUpdate,
    access: TeamAccessContext,
    db: DbSession,
) -> dict[str, Any]:
    if not access.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="팀 관리 권한이 필요합니다.")
    home_update = await _get_update_for_team(db, update_id, access.team.id)
    updated = await service.update(db, home_update, payload)
    return {"data": _to_dict(updated)}


@nested_router.post("/{update_id}/publish")
async def publish_home_update(
    update_id: UUID, access: TeamAccessContext, db: DbSession
) -> dict[str, Any]:
    if not access.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="팀 관리 권한이 필요합니다.")
    home_update = await _get_update_for_team(db, update_id, access.team.id)
    published = await service.publish(db, home_update)
    return {"data": _to_dict(published)}


@nested_router.delete("/{update_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_home_update(
    update_id: UUID, access: TeamAccessContext, db: DbSession
) -> None:
    if not access.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="팀 관리 권한이 필요합니다.")
    home_update = await _get_update_for_team(db, update_id, access.team.id)
    await service.delete(db, home_update)


@public_router.get("/{slug}")
async def get_public_share(slug: str, db: DbSession) -> dict[str, Any]:
    team, updates = await service.list_public(db, slug)
    return {
        "data": {
            "team": {
                "id": str(team.id),
                "name": team.name,
                "slug": team.slug,
                "description": team.description,
            },
            "updates": [_to_dict(u) for u in updates],
        }
    }
