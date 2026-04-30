from typing import Any

from fastapi import APIRouter, status

from app.core.permissions import (
    OrgAdmin,
    OrgMember,
    OutreachAdminContext,
    OutreachContext,
)
from app.deps import DbSession
from app.domains.outreach import service
from app.domains.outreach.schemas import (
    OutreachCreate,
    OutreachPublic,
    OutreachUpdate,
)

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
    items = await service.list_outreaches(db, membership.organization_id)
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
async def get_outreach(outreach: OutreachContext) -> dict[str, Any]:
    # TODO(team): Team 도메인 추가 후 응답에 teams 리스트 포함 (API.md 명세).
    return {"data": _to_dict(outreach)}


@flat_router.patch("/{outreach_id}")
async def update_outreach(
    payload: OutreachUpdate, outreach: OutreachAdminContext, db: DbSession
) -> dict[str, Any]:
    updated = await service.update_outreach(db, outreach.id, payload)
    return {"data": _to_dict(updated)}
