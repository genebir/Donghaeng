from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.auth.schemas import UserPublic
from app.domains.member.models import TeamMember, TeamPart, TeamRole
from app.domains.member.schemas import (
    TeamMemberAdd,
    TeamMemberPublic,
    TeamMemberUpdate,
)
from app.domains.org.models import OrgMembership, OrgRole
from app.domains.outreach.models import Outreach
from app.domains.team.models import Team
from app.domains.user.models import User


def _to_public(member: TeamMember, user: User) -> TeamMemberPublic:
    return TeamMemberPublic.model_validate(
        {
            "id": member.id,
            "team_id": member.team_id,
            "user": UserPublic.model_validate(user),
            "role": member.role,
            "part": member.part,
            "is_part_lead": member.is_part_lead,
            "emergency_info": member.emergency_info,
            "meta": member.meta,
            "created_at": member.created_at,
        }
    )


async def add_member_by_email(
    db: AsyncSession, team_id: UUID, payload: TeamMemberAdd
) -> TeamMemberPublic:
    if not payload.email and not payload.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="email 또는 user_id 중 하나는 필요합니다.")

    if payload.user_id:
        user = (await db.execute(select(User).where(User.id == payload.user_id))).scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자를 찾을 수 없습니다.")
    else:
        user = (
            await db.execute(select(User).where(User.email == payload.email))
        ).scalar_one_or_none()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"이메일 '{payload.email}'로 가입된 사용자를 찾지 못했습니다. "
                    "먼저 본인이 로그인하면 자동 가입됩니다."
                ),
            )

    existing = (
        await db.execute(
            select(TeamMember).where(
                TeamMember.team_id == team_id, TeamMember.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 이 팀에 속해있는 멤버입니다.",
        )

    # 팀 추가 시 소속 org에 OrgMembership(MEMBER)이 없으면 자동 생성
    team = (await db.execute(select(Team).where(Team.id == team_id))).scalar_one_or_none()
    if team:
        outreach = (await db.execute(select(Outreach).where(Outreach.id == team.outreach_id))).scalar_one_or_none()
        if outreach:
            org_exists = (await db.execute(
                select(OrgMembership).where(
                    OrgMembership.organization_id == outreach.organization_id,
                    OrgMembership.user_id == user.id,
                )
            )).scalar_one_or_none()
            if not org_exists:
                db.add(OrgMembership(
                    organization_id=outreach.organization_id,
                    user_id=user.id,
                    role=OrgRole.MEMBER,
                ))

    member = TeamMember(
        team_id=team_id,
        user_id=user.id,
        role=payload.role,
        part=payload.part,
        is_part_lead=payload.is_part_lead,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return _to_public(member, user)


async def list_members(
    db: AsyncSession,
    team_id: UUID,
    role: TeamRole | None = None,
    part: TeamPart | None = None,
) -> list[TeamMemberPublic]:
    stmt = (
        select(TeamMember, User)
        .join(User, User.id == TeamMember.user_id)
        .where(TeamMember.team_id == team_id)
        .order_by(TeamMember.role.asc(), TeamMember.created_at.asc())
    )
    if role is not None:
        stmt = stmt.where(TeamMember.role == role)
    if part is not None:
        stmt = stmt.where(TeamMember.part == part)
    rows = (await db.execute(stmt)).all()
    return [_to_public(member, user) for member, user in rows]


async def get_member(
    db: AsyncSession, member_id: UUID
) -> tuple[TeamMember, User]:
    """raw row + 유저 — 권한 dep에서 사용."""
    stmt = (
        select(TeamMember, User)
        .join(User, User.id == TeamMember.user_id)
        .where(TeamMember.id == member_id)
    )
    row = (await db.execute(stmt)).one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="팀 멤버를 찾을 수 없습니다.",
        )
    return row[0], row[1]


async def update_member(
    db: AsyncSession,
    member_id: UUID,
    payload: TeamMemberUpdate,
    *,
    is_self: bool,
    is_admin: bool,
) -> TeamMemberPublic:
    member, user = await get_member(db, member_id)
    fields = payload.model_dump(exclude_unset=True)

    # 본인은 emergency_info / meta 만, role / part / is_part_lead는 admin만.
    if not is_admin:
        forbidden = {"role", "part", "is_part_lead"} & fields.keys()
        if forbidden:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="role/part/is_part_lead는 팀 관리자만 변경할 수 있습니다.",
            )
        if not is_self:
            # 이 분기는 dep 단계에서 이미 차단되어야 하지만 방어적으로.
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="다른 멤버 정보를 수정할 수 없습니다.",
            )

    for key, value in fields.items():
        setattr(member, key, value)
    await db.commit()
    await db.refresh(member)
    return _to_public(member, user)


async def remove_member(db: AsyncSession, member_id: UUID) -> None:
    member, _ = await get_member(db, member_id)
    await db.delete(member)
    await db.commit()
