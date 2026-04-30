from typing import Any

from fastapi import APIRouter, status

from app.core.permissions import OrgAdmin, OrgMember
from app.deps import CurrentUser, DbSession
from app.domains.org import service
from app.domains.org.schemas import OrgCreate, OrgPublic, OrgUpdate

router = APIRouter(prefix="/orgs", tags=["orgs"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_org(
    payload: OrgCreate, db: DbSession, user: CurrentUser
) -> dict[str, Any]:
    org = await service.create_org(db, payload, user.id)
    return {"data": OrgPublic.model_validate(org).model_dump(mode="json")}


@router.get("")
async def list_my_orgs(db: DbSession, user: CurrentUser) -> dict[str, Any]:
    orgs = await service.list_my_orgs(db, user.id)
    return {
        "data": [
            OrgPublic.model_validate(org).model_dump(mode="json") for org in orgs
        ]
    }


@router.get("/{org_id}")
async def get_org(membership: OrgMember, db: DbSession) -> dict[str, Any]:
    org = await service.get_org(db, membership.organization_id)
    return {"data": OrgPublic.model_validate(org).model_dump(mode="json")}


@router.patch("/{org_id}")
async def update_org(
    payload: OrgUpdate, membership: OrgAdmin, db: DbSession
) -> dict[str, Any]:
    org = await service.update_org(db, membership.organization_id, payload)
    return {"data": OrgPublic.model_validate(org).model_dump(mode="json")}


@router.get("/{org_id}/members")
async def list_members(membership: OrgMember, db: DbSession) -> dict[str, Any]:
    members = await service.list_members(db, membership.organization_id)
    return {"data": [m.model_dump(mode="json") for m in members]}
