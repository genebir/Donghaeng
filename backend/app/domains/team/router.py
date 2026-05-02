from typing import Any

from fastapi import APIRouter, HTTPException, status

from app.core.permissions import (
    OutreachAdminContext,
    TeamAdminContext,
    TeamContext,
)
from app.deps import CurrentUser, DbSession
from app.domains.team import service
from app.domains.team.schemas import (
    DestinationPublic,
    DestinationUpsert,
    InviteInfo,
    InviteTokenPublic,
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

# /api/v1/invite/{token}
invite_router = APIRouter(prefix="/invite", tags=["invite"])


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


# ── 초대 링크 (팀 관리자용) ────────────────────────────────────────────────

@flat_router.post("/{team_id}/invite-token", status_code=status.HTTP_201_CREATED)
async def generate_invite_token(
    team: TeamAdminContext, db: DbSession, user: CurrentUser
) -> dict[str, Any]:
    invite = await service.generate_invite_token(db, team.id, user.id)
    return {"data": InviteTokenPublic.model_validate(invite).model_dump(mode="json")}


@flat_router.get("/{team_id}/invite-token")
async def get_invite_token(team: TeamAdminContext, db: DbSession) -> dict[str, Any]:
    invite = await service.get_invite_token_for_team(db, team.id)
    if invite is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="초대 링크가 없습니다."
        )
    return {"data": InviteTokenPublic.model_validate(invite).model_dump(mode="json")}


@flat_router.delete("/{team_id}/invite-token", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_invite_token(team: TeamAdminContext, db: DbSession) -> None:
    await service.revoke_invite_token(db, team.id)


# ── 공개 초대 엔드포인트 ───────────────────────────────────────────────────

@invite_router.get("/{token}")
async def get_invite_info(token: str, db: DbSession) -> dict[str, Any]:
    team, outreach = await service.get_info_by_invite_token(db, token)
    return {
        "data": InviteInfo(
            token=token,
            team_id=team.id,
            team_name=team.name,
            outreach_name=outreach.name,
            starts_on=team.starts_on,
            ends_on=team.ends_on,
            description=team.description,
        ).model_dump(mode="json")
    }


@invite_router.post("/{token}/join", status_code=status.HTTP_201_CREATED)
async def join_via_invite(
    token: str, db: DbSession, user: CurrentUser
) -> dict[str, Any]:
    from app.domains.member import service as member_service
    from app.domains.member.models import TeamRole
    from app.domains.member.schemas import TeamMemberAdd

    team, _ = await service.get_info_by_invite_token(db, token)
    payload = TeamMemberAdd(user_id=user.id, role=TeamRole.MEMBER)
    public = await member_service.add_member_by_email(db, team.id, payload)
    return {"data": {"team_id": str(team.id), "member": public.model_dump(by_alias=True, mode="json")}}
