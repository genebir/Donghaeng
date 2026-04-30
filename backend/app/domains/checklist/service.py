from collections.abc import Sequence
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.checklist.models import (
    ChecklistCategory,
    ChecklistItem,
    ChecklistStatus,
)
from app.domains.checklist.schemas import (
    ChecklistItemCreate,
    ChecklistItemUpdate,
)
from app.domains.member.models import TeamMember


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
    db: AsyncSession, team_id: UUID, payload: ChecklistItemCreate
) -> ChecklistItem:
    await _validate_owner(db, team_id, payload.owner_member_id)
    item = ChecklistItem(
        team_id=team_id,
        category=payload.category,
        title=payload.title,
        quantity=payload.quantity,
        owner_member_id=payload.owner_member_id,
        due_date=payload.due_date,
        status=payload.status,
        cost_amount=payload.cost_amount,
        cost_currency=payload.cost_currency,
        notes=payload.notes,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def list_items(
    db: AsyncSession,
    team_id: UUID,
    category: ChecklistCategory | None = None,
    status_filter: ChecklistStatus | None = None,
) -> Sequence[ChecklistItem]:
    stmt = (
        select(ChecklistItem)
        .where(ChecklistItem.team_id == team_id)
        .order_by(
            ChecklistItem.category.asc(),
            ChecklistItem.due_date.asc().nulls_last(),
            ChecklistItem.created_at.asc(),
        )
    )
    if category is not None:
        stmt = stmt.where(ChecklistItem.category == category)
    if status_filter is not None:
        stmt = stmt.where(ChecklistItem.status == status_filter)
    return list((await db.execute(stmt)).scalars())


async def get_item(db: AsyncSession, item_id: UUID) -> ChecklistItem:
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
    return item


async def update_item(
    db: AsyncSession, item: ChecklistItem, payload: ChecklistItemUpdate
) -> ChecklistItem:
    fields = payload.model_dump(exclude_unset=True)
    if "owner_member_id" in fields:
        await _validate_owner(db, item.team_id, fields["owner_member_id"])
    for key, value in fields.items():
        setattr(item, key, value)
    await db.commit()
    await db.refresh(item)
    return item


async def delete_item(db: AsyncSession, item: ChecklistItem) -> None:
    await db.delete(item)
    await db.commit()
