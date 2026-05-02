from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Path, status

from app.core.permissions import (
    OrgAdmin,
    OrgMember,
    OutreachAdminContext,
    OutreachContext,
)
from app.domains.org.models import OrgRole
from app.deps import DbSession
from app.domains.outreach import service
from app.domains.outreach.schemas import (
    OutreachCreate,
    OutreachMembershipCreate,
    OutreachMembershipPublic,
    OutreachPublic,
    OutreachUpdate,
)
from app.domains.team import service as team_service
from app.domains.team.schemas import TeamPublic

# /api/v1/orgs/{org_id}/outreaches
nested_router = APIRouter(
    prefix="/orgs/{org_id}/outreaches",
    tags=["outreach"],
)

# /api/v1/outreaches/{outreach_id}
flat_router = APIRouter(prefix="/outreaches", tags=["outreach"])


def _to_dict(outreach: Any) -> dict[str, Any]:
    return OutreachPublic.model_validate(outreach).model_dump(mode="json")


@nested_router.get("")
async def list_outreaches(
    membership: OrgMember, db: DbSession
) -> dict[str, Any]:
    is_admin = membership.role in (OrgRole.OWNER, OrgRole.ADMIN)
    items = await service.list_outreaches(
        db, membership.organization_id, membership.user_id, is_admin
    )
    return {"data": [_to_dict(o) for o in items]}


@nested_router.post("", status_code=status.HTTP_201_CREATED)
async def create_outreach(
    payload: OutreachCreate, membership: OrgAdmin, db: DbSession
) -> dict[str, Any]:
    outreach = await service.create_outreach(
        db, membership.organization_id, payload
    )
    return {"data": _to_dict(outreach)}


@flat_router.get("/{outreach_id}")
async def get_outreach(
    outreach: OutreachContext, db: DbSession
) -> dict[str, Any]:
    teams = await team_service.list_teams_in_outreach(db, outreach.id)
    return {
        "data": {
            **_to_dict(outreach),
            "teams": [
                TeamPublic.model_validate(t).model_dump(mode="json")
                for t in teams
            ],
        }
    }


@flat_router.patch("/{outreach_id}")
async def update_outreach(
    payload: OutreachUpdate, outreach: OutreachAdminContext, db: DbSession
) -> dict[str, Any]:
    updated = await service.update_outreach(db, outreach.id, payload)
    return {"data": _to_dict(updated)}


@flat_router.get("/{outreach_id}/members")
async def list_outreach_members_route(
    outreach: OutreachContext, db: DbSession
) -> dict[str, Any]:
    members = await service.list_outreach_members(db, outreach.id)
    return {"data": [m.model_dump(mode="json") for m in members]}


@flat_router.post("/{outreach_id}/members", status_code=status.HTTP_201_CREATED)
async def add_outreach_member_route(
    outreach: OutreachAdminContext,
    payload: OutreachMembershipCreate,
    db: DbSession,
) -> dict[str, Any]:
    m = await service.add_outreach_member(db, outreach.id, payload)
    return {"data": m.model_dump(mode="json")}


@flat_router.delete("/{outreach_id}/members/{membership_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_outreach_member_route(
    outreach: OutreachAdminContext,
    membership_id: Annotated[UUID, Path()],
    db: DbSession,
) -> None:
    await service.remove_outreach_member(db, outreach.id, membership_id)
    await db.commit()
