from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Path, status
from sqlalchemy import select

from app.deps import CurrentUser, DbSession
from app.domains.org.models import OrgMembership, OrgRole
from app.domains.outreach.models import Outreach
from app.domains.team.models import Team


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


# ===========================================================================
# Outreach scope
# ===========================================================================
# 권한은 부모 조직의 멤버십을 따른다 — outreach 자체에 별도의 role은 없음.

async def _resolve_outreach_membership(
    db: DbSession,
    user: CurrentUser,
    outreach_id: UUID,
) -> tuple[Outreach, OrgMembership]:
    outreach = (
        await db.execute(select(Outreach).where(Outreach.id == outreach_id))
    ).scalar_one_or_none()
    if outreach is None:
        # 미존재 vs 비멤버 구분 누설 방지를 위해 동일하게 403.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 아웃리치에 접근할 수 없습니다.",
        )
    membership = (
        await db.execute(
            select(OrgMembership).where(
                OrgMembership.organization_id == outreach.organization_id,
                OrgMembership.user_id == user.id,
            )
        )
    ).scalar_one_or_none()
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 아웃리치에 접근할 수 없습니다.",
        )
    return outreach, membership


async def require_outreach_member(
    db: DbSession,
    user: CurrentUser,
    outreach_id: Annotated[UUID, Path()],
) -> Outreach:
    outreach, _ = await _resolve_outreach_membership(db, user, outreach_id)
    return outreach


OutreachContext = Annotated[Outreach, Depends(require_outreach_member)]


async def require_outreach_admin(
    db: DbSession,
    user: CurrentUser,
    outreach_id: Annotated[UUID, Path()],
) -> Outreach:
    outreach, membership = await _resolve_outreach_membership(db, user, outreach_id)
    if membership.role not in (OrgRole.OWNER, OrgRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="조직 관리자 권한이 필요합니다.",
        )
    return outreach


OutreachAdminContext = Annotated[Outreach, Depends(require_outreach_admin)]


# ===========================================================================
# Team scope
# ===========================================================================
# 팀 권한은 부모 outreach → 부모 organization 멤버십을 따른다.
# DATABASE.md "팀 일반 관리: role = LEADER"는 team_member 도입 후 require_team_admin
# 안에서 LEADER 체크를 추가하는 형태로 확장 예정.

async def _resolve_team_membership(
    db: DbSession,
    user: CurrentUser,
    team_id: UUID,
) -> tuple[Team, OrgMembership]:
    team = (
        await db.execute(select(Team).where(Team.id == team_id))
    ).scalar_one_or_none()
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 팀에 접근할 수 없습니다.",
        )
    outreach = (
        await db.execute(select(Outreach).where(Outreach.id == team.outreach_id))
    ).scalar_one_or_none()
    if outreach is None:
        # 데이터 일관성 깨짐 (FK 보호되지만 방어적으로).
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 팀에 접근할 수 없습니다.",
        )
    membership = (
        await db.execute(
            select(OrgMembership).where(
                OrgMembership.organization_id == outreach.organization_id,
                OrgMembership.user_id == user.id,
            )
        )
    ).scalar_one_or_none()
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 팀에 접근할 수 없습니다.",
        )
    return team, membership


async def require_team_member(
    db: DbSession,
    user: CurrentUser,
    team_id: Annotated[UUID, Path()],
) -> Team:
    team, _ = await _resolve_team_membership(db, user, team_id)
    return team


TeamContext = Annotated[Team, Depends(require_team_member)]


async def require_team_admin(
    db: DbSession,
    user: CurrentUser,
    team_id: Annotated[UUID, Path()],
) -> Team:
    team, membership = await _resolve_team_membership(db, user, team_id)
    if membership.role not in (OrgRole.OWNER, OrgRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="팀 관리 권한이 필요합니다.",
        )
    return team


TeamAdminContext = Annotated[Team, Depends(require_team_admin)]
