from collections.abc import Sequence
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.member.models import TeamMember
from app.domains.schedule.models import ScheduleItem
from app.domains.schedule.schemas import ScheduleItemCreate, ScheduleItemUpdate


async def _validate_owner(
    db: AsyncSession, team_id: UUID, owner_member_id: UUID | None
) -> None:
    if owner_member_id is None:
        return
    member = (
        await db.execute(
            select(TeamMember).where(
                TeamMember.id == owner_member_id, TeamMember.team_id == team_id
            )
        )
    ).scalar_one_or_none()
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="owner_member_id가 이 팀의 멤버가 아닙니다.",
        )


async def create_item(
    db: AsyncSession, team_id: UUID, payload: ScheduleItemCreate
) -> ScheduleItem:
    await _validate_owner(db, team_id, payload.owner_member_id)
    item = ScheduleItem(
        team_id=team_id,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        title=payload.title,
        kind=payload.kind,
        location=payload.location,
        description=payload.description,
        owner_member_id=payload.owner_member_id,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def list_items(
    db: AsyncSession,
    team_id: UUID,
    range_from: datetime | None = None,
    range_to: datetime | None = None,
) -> Sequence[ScheduleItem]:
    stmt = (
        select(ScheduleItem)
        .where(ScheduleItem.team_id == team_id)
        .order_by(ScheduleItem.starts_at.asc())
    )
    if range_from is not None:
        stmt = stmt.where(ScheduleItem.starts_at >= range_from)
    if range_to is not None:
        stmt = stmt.where(ScheduleItem.starts_at < range_to)
    return list((await db.execute(stmt)).scalars())


async def get_item(db: AsyncSession, item_id: UUID) -> ScheduleItem:
    item = (
        await db.execute(
            select(ScheduleItem).where(ScheduleItem.id == item_id)
        )
    ).scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="일정을 찾을 수 없습니다.",
        )
    return item


async def update_item(
    db: AsyncSession, item: ScheduleItem, payload: ScheduleItemUpdate
) -> ScheduleItem:
    fields = payload.model_dump(exclude_unset=True)
    if "owner_member_id" in fields:
        await _validate_owner(db, item.team_id, fields["owner_member_id"])
    for key, value in fields.items():
        setattr(item, key, value)
    await db.commit()
    await db.refresh(item)
    return item


async def delete_item(db: AsyncSession, item: ScheduleItem) -> None:
    await db.delete(item)
    await db.commit()
