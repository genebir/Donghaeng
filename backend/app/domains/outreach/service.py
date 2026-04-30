from collections.abc import Sequence
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.outreach.models import Outreach
from app.domains.outreach.schemas import OutreachCreate, OutreachUpdate


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


async def list_outreaches(db: AsyncSession, org_id: UUID) -> Sequence[Outreach]:
    stmt = (
        select(Outreach)
        .where(Outreach.organization_id == org_id)
        .order_by(Outreach.year.desc(), Outreach.created_at.desc())
    )
    return list((await db.execute(stmt)).scalars())


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
