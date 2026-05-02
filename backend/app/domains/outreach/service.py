from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, union
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.auth.schemas import UserPublic
from app.domains.outreach.models import Outreach, OutreachMembership
from app.domains.outreach.schemas import OutreachCreate, OutreachMembershipCreate, OutreachMembershipPublic, OutreachUpdate
from app.domains.user.models import User


async def create_outreach(
    db: AsyncSession, org_id: UUID, payload: OutreachCreate
) -> Outreach:
    outreach = Outreach(
        organization_id=org_id,
        name=payload.name,
        year=payload.year,
        starts_on=payload.starts_on,
        ends_on=payload.ends_on,
        description=payload.description,
    )
    db.add(outreach)
    await db.commit()
    await db.refresh(outreach)
    return outreach


async def list_outreaches(
    db: AsyncSession, org_id: UUID, user_id: UUID, is_org_admin: bool
) -> list[Outreach]:
    if is_org_admin:
        result = await db.execute(
            select(Outreach)
            .where(Outreach.organization_id == org_id)
            .order_by(Outreach.year.desc())
        )
        return list(result.scalars())

    # DIRECTOR/STAFF: OutreachMembership 으로 접근 가능한 아웃리치
    from app.domains.member.models import TeamMember
    from app.domains.team.models import Team

    # 1) 직접 OutreachMembership이 있는 outreach_id
    om_q = select(OutreachMembership.outreach_id).where(
        OutreachMembership.user_id == user_id
    )
    # 2) TeamMember → Team → Outreach 경유
    tm_q = (
        select(Team.outreach_id)
        .join(TeamMember, TeamMember.team_id == Team.id)
        .where(TeamMember.user_id == user_id)
    )
    outreach_ids_q = union(om_q, tm_q).subquery()
    result = await db.execute(
        select(Outreach)
        .where(
            Outreach.organization_id == org_id,
            Outreach.id.in_(select(outreach_ids_q)),
        )
        .order_by(Outreach.year.desc())
    )
    return list(result.scalars())


async def get_outreach(db: AsyncSession, outreach_id: UUID) -> Outreach:
    outreach = (
        await db.execute(select(Outreach).where(Outreach.id == outreach_id))
    ).scalar_one_or_none()
    if outreach is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="아웃리치를 찾을 수 없습니다.",
        )
    return outreach


async def update_outreach(
    db: AsyncSession, outreach_id: UUID, payload: OutreachUpdate
) -> Outreach:
    outreach = await get_outreach(db, outreach_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(outreach, key, value)
    await db.commit()
    await db.refresh(outreach)
    return outreach


def _membership_to_public(m: OutreachMembership, user: User) -> OutreachMembershipPublic:
    return OutreachMembershipPublic.model_validate(
        {
            "id": m.id,
            "outreach_id": m.outreach_id,
            "user_id": m.user_id,
            "user": UserPublic.model_validate(user),
            "role": m.role,
            "team_id": m.team_id,
            "created_at": m.created_at,
        }
    )


async def add_outreach_member(
    db: AsyncSession, outreach_id: UUID, payload: OutreachMembershipCreate
) -> OutreachMembershipPublic:
    """Upsert: 이미 있으면 role/team_id 업데이트."""
    user = (await db.execute(select(User).where(User.id == payload.user_id))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자를 찾을 수 없습니다.")

    existing = (
        await db.execute(
            select(OutreachMembership).where(
                OutreachMembership.outreach_id == outreach_id,
                OutreachMembership.user_id == payload.user_id,
            )
        )
    ).scalar_one_or_none()
    if existing:
        existing.role = payload.role
        existing.team_id = payload.team_id
        await db.commit()
        await db.refresh(existing)
        return _membership_to_public(existing, user)
    m = OutreachMembership(outreach_id=outreach_id, **payload.model_dump())
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return _membership_to_public(m, user)


async def remove_outreach_member(
    db: AsyncSession, outreach_id: UUID, membership_id: UUID
) -> None:
    m = (
        await db.execute(
            select(OutreachMembership).where(
                OutreachMembership.id == membership_id,
                OutreachMembership.outreach_id == outreach_id,
            )
        )
    ).scalar_one_or_none()
    if m:
        await db.delete(m)
        await db.commit()


async def list_outreach_members(
    db: AsyncSession, outreach_id: UUID
) -> list[OutreachMembershipPublic]:
    rows = (await db.execute(
        select(OutreachMembership, User)
        .join(User, User.id == OutreachMembership.user_id)
        .where(OutreachMembership.outreach_id == outreach_id)
        .order_by(OutreachMembership.created_at.asc())
    )).all()
    return [_membership_to_public(m, u) for m, u in rows]


async def get_outreach_memberships_for_user(
    db: AsyncSession, user_id: UUID
) -> list[OutreachMembership]:
    result = await db.execute(
        select(OutreachMembership).where(OutreachMembership.user_id == user_id)
    )
    return list(result.scalars())
