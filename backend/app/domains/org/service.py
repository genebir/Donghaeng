from collections.abc import Sequence
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.auth.schemas import UserPublic
from app.domains.org.models import Organization, OrgMembership, OrgRole
from app.domains.org.schemas import (
    OrgCreate,
    OrgMembershipPublic,
    OrgUpdate,
)
from app.domains.user.models import User


async def create_org(
    db: AsyncSession, payload: OrgCreate, owner_user_id: UUID
) -> Organization:
    existing = await db.execute(
        select(Organization).where(Organization.slug == payload.slug)
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"slug '{payload.slug}'은 이미 사용 중입니다.",
        )

    org = Organization(
        name=payload.name,
        slug=payload.slug,
        logo_url=payload.logo_url,
        primary_color=payload.primary_color,
    )
    db.add(org)
    await db.flush()

    membership = OrgMembership(
        organization_id=org.id,
        user_id=owner_user_id,
        role=OrgRole.OWNER,
    )
    db.add(membership)

    await db.commit()
    await db.refresh(org)
    return org


async def list_my_orgs(db: AsyncSession, user_id: UUID) -> Sequence[Organization]:
    stmt = (
        select(Organization)
        .join(OrgMembership, OrgMembership.organization_id == Organization.id)
        .where(OrgMembership.user_id == user_id)
        .order_by(Organization.name)
    )
    return list((await db.execute(stmt)).scalars())


async def get_org(db: AsyncSession, org_id: UUID) -> Organization:
    org = (
        await db.execute(select(Organization).where(Organization.id == org_id))
    ).scalar_one_or_none()
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="조직을 찾을 수 없습니다.",
        )
    return org


async def update_org(
    db: AsyncSession, org_id: UUID, payload: OrgUpdate
) -> Organization:
    org = await get_org(db, org_id)
    update_fields = payload.model_dump(exclude_unset=True)
    for key, value in update_fields.items():
        setattr(org, key, value)
    await db.commit()
    await db.refresh(org)
    return org


async def list_members(
    db: AsyncSession, org_id: UUID
) -> list[OrgMembershipPublic]:
    stmt = (
        select(OrgMembership, User)
        .join(User, User.id == OrgMembership.user_id)
        .where(OrgMembership.organization_id == org_id)
        .order_by(OrgMembership.created_at.asc())
    )
    rows = (await db.execute(stmt)).all()
    return [
        OrgMembershipPublic(
            id=membership.id,
            user=UserPublic.model_validate(user),
            role=membership.role,
            church_position=membership.church_position,
            village_name=membership.village_name,
            created_at=membership.created_at,
        )
        for membership, user in rows
    ]
