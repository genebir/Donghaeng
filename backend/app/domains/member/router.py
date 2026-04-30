from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, Query, status

from app.core.permissions import (
    MemberAdminOrSelfContext,
    TeamAdminContext,
    TeamContext,
)
from app.deps import DbSession
from app.domains.member import service
from app.domains.member.models import TeamPart, TeamRole
from app.domains.member.schemas import (
    TeamMemberAdd,
    TeamMemberUpdate,
)

# /api/v1/teams/{team_id}/members
nested_router = APIRouter(prefix="/teams/{team_id}/members", tags=["member"])

# /api/v1/team-members/{member_id}
flat_router = APIRouter(prefix="/team-members", tags=["member"])


@nested_router.post("", status_code=status.HTTP_201_CREATED)
async def add_member(
    payload: TeamMemberAdd, team: TeamAdminContext, db: DbSession
) -> dict[str, Any]:
    public = await service.add_member_by_email(db, team.id, payload)
    return {"data": public.model_dump(by_alias=True, mode="json")}


@nested_router.get("")
async def list_members(
    team: TeamContext,
    db: DbSession,
    role: Annotated[TeamRole | None, Query()] = None,
    part: Annotated[TeamPart | None, Query()] = None,
) -> dict[str, Any]:
    members = await service.list_members(db, team.id, role=role, part=part)
    return {"data": [m.model_dump(by_alias=True, mode="json") for m in members]}


@flat_router.patch("/{member_id}")
async def update_member(
    payload: TeamMemberUpdate, access: MemberAdminOrSelfContext, db: DbSession
) -> dict[str, Any]:
    public = await service.update_member(
        db,
        access.member.id,
        payload,
        is_self=access.is_self,
        is_admin=access.is_admin,
    )
    return {"data": public.model_dump(by_alias=True, mode="json")}


@flat_router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_member(access: MemberAdminOrSelfContext, db: DbSession) -> None:
    if not access.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="팀 멤버 제거는 팀 관리자만 가능합니다.",
        )
    await service.remove_member(db, access.member.id)
