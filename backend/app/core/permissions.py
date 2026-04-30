from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Path, status
from sqlalchemy import select

from app.deps import CurrentUser, DbSession
from app.domains.org.models import OrgMembership, OrgRole


async def require_org_member(
    db: DbSession,
    user: CurrentUser,
    org_id: Annotated[UUID, Path()],
) -> OrgMembership:
    stmt = select(OrgMembership).where(
        OrgMembership.organization_id == org_id,
        OrgMembership.user_id == user.id,
    )
    membership = (await db.execute(stmt)).scalar_one_or_none()
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 조직에 속해있지 않습니다.",
        )
    return membership


OrgMember = Annotated[OrgMembership, Depends(require_org_member)]


async def require_org_admin(membership: OrgMember) -> OrgMembership:
    if membership.role not in (OrgRole.OWNER, OrgRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="조직 관리자 권한이 필요합니다.",
        )
    return membership


OrgAdmin = Annotated[OrgMembership, Depends(require_org_admin)]


async def require_org_owner(membership: OrgMember) -> OrgMembership:
    if membership.role != OrgRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="조직 OWNER 권한이 필요합니다.",
        )
    return membership


OrgOwner = Annotated[OrgMembership, Depends(require_org_owner)]
