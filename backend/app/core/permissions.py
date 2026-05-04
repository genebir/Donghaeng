from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Path, status
from sqlalchemy import select

from app.deps import CurrentUser, DbSession
from app.domains.checklist.models import ChecklistItem
from app.domains.expense.models import Expense
from app.domains.member.models import TeamMember, TeamRole
from app.domains.org.models import OrgMembership, OrgRole
from app.domains.outreach.models import Outreach
from app.domains.schedule.models import ScheduleItem
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

async def _resolve_outreach_membership(
    db: DbSession,
    user: CurrentUser,
    outreach_id: UUID,
) -> tuple[Outreach, OrgMembership | None]:
    outreach = (
        await db.execute(select(Outreach).where(Outreach.id == outreach_id))
    ).scalar_one_or_none()
    if outreach is None:
        # 미존재 vs 비멤버 구분 누설 방지를 위해 동일하게 403.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 아웃리치에 접근할 수 없습니다.",
        )
    org_membership = (
        await db.execute(
            select(OrgMembership).where(
                OrgMembership.organization_id == outreach.organization_id,
                OrgMembership.user_id == user.id,
            )
        )
    ).scalar_one_or_none()

    if org_membership:
        return outreach, org_membership

    # OutreachMembership 체크
    from app.domains.outreach.models import OutreachMembership
    om = (
        await db.execute(
            select(OutreachMembership).where(
                OutreachMembership.outreach_id == outreach_id,
                OutreachMembership.user_id == user.id,
            )
        )
    ).scalar_one_or_none()
    if om:
        return outreach, None

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="이 아웃리치에 접근할 수 없습니다.",
    )


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
    outreach, org_membership = await _resolve_outreach_membership(db, user, outreach_id)
    if org_membership and org_membership.role in (OrgRole.OWNER, OrgRole.ADMIN):
        return outreach
    # OutreachMembership.DIRECTOR 체크
    from app.domains.outreach.models import OutreachMembership, OutreachRole
    om = (
        await db.execute(
            select(OutreachMembership).where(
                OutreachMembership.outreach_id == outreach_id,
                OutreachMembership.user_id == user.id,
            )
        )
    ).scalar_one_or_none()
    if om and om.role == OutreachRole.DIRECTOR:
        return outreach
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="아웃리치 관리 권한이 필요합니다.",
    )


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
) -> tuple[Team, OrgMembership | None]:
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

    org_membership = (
        await db.execute(
            select(OrgMembership).where(
                OrgMembership.organization_id == outreach.organization_id,
                OrgMembership.user_id == user.id,
            )
        )
    ).scalar_one_or_none()

    # OWNER/ADMIN → 바로 통과
    if org_membership and org_membership.role in (OrgRole.OWNER, OrgRole.ADMIN):
        return team, org_membership

    # OutreachMembership 확인 (DIRECTOR or STAFF for this team)
    from app.domains.outreach.models import OutreachMembership, OutreachRole
    om = (
        await db.execute(
            select(OutreachMembership).where(
                OutreachMembership.outreach_id == team.outreach_id,
                OutreachMembership.user_id == user.id,
            )
        )
    ).scalar_one_or_none()
    if om:
        # DIRECTOR → outreach 전체 접근
        # STAFF → team_id 일치 시 접근
        if om.role == OutreachRole.DIRECTOR or (
            om.role == OutreachRole.STAFF and om.team_id == team.id
        ):
            return team, org_membership  # org_membership may be None

    # TeamMember 직접 확인
    tm = (
        await db.execute(
            select(TeamMember).where(
                TeamMember.team_id == team.id,
                TeamMember.user_id == user.id,
            )
        )
    ).scalar_one_or_none()
    if tm:
        return team, org_membership

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="이 팀에 접근할 수 없습니다.",
    )


async def require_team_member(
    db: DbSession,
    user: CurrentUser,
    team_id: Annotated[UUID, Path()],
) -> Team:
    team, _ = await _resolve_team_membership(db, user, team_id)
    return team


TeamContext = Annotated[Team, Depends(require_team_member)]


async def _check_team_admin(
    db: DbSession,
    user_id: UUID,
    team: Team,
    org_membership: OrgMembership | None,
) -> bool:
    """DATABASE.md '팀 일반 관리: role = LEADER' + 조직 OWNER/ADMIN + OutreachMembership DIRECTOR/STAFF."""
    # OrgRole OWNER/ADMIN
    if org_membership and org_membership.role in (OrgRole.OWNER, OrgRole.ADMIN):
        return True
    # OutreachMembership DIRECTOR or STAFF for this team
    from app.domains.outreach.models import OutreachMembership, OutreachRole
    om = (
        await db.execute(
            select(OutreachMembership).where(
                OutreachMembership.outreach_id == team.outreach_id,
                OutreachMembership.user_id == user_id,
            )
        )
    ).scalar_one_or_none()
    if om:
        if om.role == OutreachRole.DIRECTOR:
            return True
        if om.role == OutreachRole.STAFF and om.team_id == team.id:
            return True
    # TeamMember LEADER
    leader = (
        await db.execute(
            select(TeamMember).where(
                TeamMember.team_id == team.id,
                TeamMember.user_id == user_id,
                TeamMember.role == TeamRole.LEADER,
            )
        )
    ).scalar_one_or_none()
    return leader is not None


async def require_team_admin(
    db: DbSession,
    user: CurrentUser,
    team_id: Annotated[UUID, Path()],
) -> Team:
    team, org_membership = await _resolve_team_membership(db, user, team_id)
    if not await _check_team_admin(db, user.id, team, org_membership):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="팀 관리 권한이 필요합니다.",
        )
    return team


TeamAdminContext = Annotated[Team, Depends(require_team_admin)]


@dataclass
class TeamAccess:
    team: Team
    user_id: UUID
    is_admin: bool


async def require_team_access(
    db: DbSession,
    user: CurrentUser,
    team_id: Annotated[UUID, Path()],
) -> TeamAccess:
    """팀 멤버 + admin 여부를 함께 노출 — 라우터에서 분기용 (예: 회계)."""
    team, org_membership = await _resolve_team_membership(db, user, team_id)
    is_admin = await _check_team_admin(db, user.id, team, org_membership)
    return TeamAccess(team=team, user_id=user.id, is_admin=is_admin)


TeamAccessContext = Annotated[TeamAccess, Depends(require_team_access)]


# ===========================================================================
# TeamMember scope
# ===========================================================================

async def _resolve_member_access(
    db: DbSession,
    user: CurrentUser,
    member_id: UUID,
) -> tuple[TeamMember, bool, bool]:
    """
    Returns (member, is_self, is_admin).
    is_admin = 부모 조직의 OWNER/ADMIN 또는 같은 팀의 LEADER.
    is_self = member.user_id == user.id.
    둘 다 False 이면 호출자는 ``require_member_admin_or_self``에서 403.
    """
    member = (
        await db.execute(select(TeamMember).where(TeamMember.id == member_id))
    ).scalar_one_or_none()
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 멤버에 접근할 수 없습니다.",
        )

    is_self = member.user_id == user.id

    team = (
        await db.execute(select(Team).where(Team.id == member.team_id))
    ).scalar_one_or_none()
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 멤버에 접근할 수 없습니다.",
        )
    outreach = (
        await db.execute(select(Outreach).where(Outreach.id == team.outreach_id))
    ).scalar_one_or_none()
    if outreach is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 멤버에 접근할 수 없습니다.",
        )
    org_membership = (
        await db.execute(
            select(OrgMembership).where(
                OrgMembership.organization_id == outreach.organization_id,
                OrgMembership.user_id == user.id,
            )
        )
    ).scalar_one_or_none()

    is_admin = False
    if org_membership and org_membership.role in (OrgRole.OWNER, OrgRole.ADMIN):
        is_admin = True
    if not is_admin:
        leader = (
            await db.execute(
                select(TeamMember).where(
                    TeamMember.team_id == team.id,
                    TeamMember.user_id == user.id,
                    TeamMember.role == TeamRole.LEADER,
                )
            )
        ).scalar_one_or_none()
        if leader is not None:
            is_admin = True

    if not (is_admin or is_self) and org_membership is None:
        # 같은 조직 멤버도 아니면 일관 403.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 멤버에 접근할 수 없습니다.",
        )
    return member, is_self, is_admin


@dataclass
class MemberAccess:
    member: TeamMember
    is_self: bool
    is_admin: bool


async def require_member_access(
    db: DbSession,
    user: CurrentUser,
    member_id: Annotated[UUID, Path()],
) -> MemberAccess:
    """
    Read 접근 — 같은 조직 멤버면 OK. 권한 분기는 라우터에서 is_admin/is_self로.
    """
    member, is_self, is_admin = await _resolve_member_access(db, user, member_id)
    return MemberAccess(member=member, is_self=is_self, is_admin=is_admin)


MemberAccessContext = Annotated[MemberAccess, Depends(require_member_access)]


async def require_member_admin_or_self(
    access: MemberAccessContext,
) -> MemberAccess:
    if not (access.is_admin or access.is_self):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="본인 또는 팀 관리자만 변경할 수 있습니다.",
        )
    return access


MemberAdminOrSelfContext = Annotated[MemberAccess, Depends(require_member_admin_or_self)]


# ===========================================================================
# Schedule / Checklist item scope
# ===========================================================================
# 둘 다 team_id를 가지므로 동일한 패턴 — 아이템 → 팀 → 조직 멤버십 walk.
# read는 team-level 라우터에서 TeamContext로 처리. 이쪽은 admin 전용.

async def require_schedule_item_admin(
    db: DbSession,
    user: CurrentUser,
    item_id: Annotated[UUID, Path()],
) -> ScheduleItem:
    item = (
        await db.execute(select(ScheduleItem).where(ScheduleItem.id == item_id))
    ).scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 일정에 접근할 수 없습니다.",
        )
    team, org_membership = await _resolve_team_membership(db, user, item.team_id)
    if not await _check_team_admin(db, user.id, team, org_membership):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="팀 관리 권한이 필요합니다.",
        )
    return item


ScheduleItemAdminContext = Annotated[
    ScheduleItem, Depends(require_schedule_item_admin)
]


async def require_checklist_item_admin(
    db: DbSession,
    user: CurrentUser,
    item_id: Annotated[UUID, Path()],
) -> ChecklistItem:
    item = (
        await db.execute(
            select(ChecklistItem).where(ChecklistItem.id == item_id)
        )
    ).scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 준비물에 접근할 수 없습니다.",
        )
    team, org_membership = await _resolve_team_membership(db, user, item.team_id)
    if not await _check_team_admin(db, user.id, team, org_membership):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="팀 관리 권한이 필요합니다.",
        )
    return item


ChecklistItemAdminContext = Annotated[
    ChecklistItem, Depends(require_checklist_item_admin)
]


@dataclass
class ChecklistItemAccess:
    item: ChecklistItem
    is_admin: bool


async def require_checklist_item_member(
    db: DbSession,
    user: CurrentUser,
    item_id: Annotated[UUID, Path()],
) -> ChecklistItemAccess:
    item = (
        await db.execute(
            select(ChecklistItem).where(ChecklistItem.id == item_id)
        )
    ).scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="준비물을 찾을 수 없습니다.",
        )
    team, org_membership = await _resolve_team_membership(db, user, item.team_id)
    is_admin = await _check_team_admin(db, user.id, team, org_membership)
    return ChecklistItemAccess(item=item, is_admin=is_admin)


ChecklistItemMemberContext = Annotated[
    ChecklistItemAccess, Depends(require_checklist_item_member)
]


# ===========================================================================
# Expense scope
# ===========================================================================
# expense는 본인(=purchaser) 또는 admin이 접근 가능. read/write 분기는 라우터에서.

@dataclass
class ExpenseAccess:
    expense: Expense
    user_id: UUID
    is_self: bool
    is_admin: bool


async def require_expense_access(
    db: DbSession,
    user: CurrentUser,
    expense_id: Annotated[UUID, Path()],
) -> ExpenseAccess:
    expense = (
        await db.execute(select(Expense).where(Expense.id == expense_id))
    ).scalar_one_or_none()
    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 지출에 접근할 수 없습니다.",
        )
    team, org_membership = await _resolve_team_membership(db, user, expense.team_id)
    is_admin = await _check_team_admin(db, user.id, team, org_membership)
    is_self = expense.purchaser_user_id == user.id
    if not (is_admin or is_self):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 지출에 접근할 수 없습니다.",
        )
    return ExpenseAccess(
        expense=expense, user_id=user.id, is_self=is_self, is_admin=is_admin
    )


ExpenseAccessContext = Annotated[ExpenseAccess, Depends(require_expense_access)]


async def require_expense_admin(access: ExpenseAccessContext) -> ExpenseAccess:
    if not access.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="회계 관리 권한이 필요합니다.",
        )
    return access


ExpenseAdminContext = Annotated[ExpenseAccess, Depends(require_expense_admin)]
