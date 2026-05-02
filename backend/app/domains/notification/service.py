from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.notification.models import Notification, NotificationKind


async def create_notification(
    db: AsyncSession,
    recipient_user_id: UUID,
    team_id: UUID,
    kind: NotificationKind,
    title: str,
    body: str | None = None,
    ref_id: UUID | None = None,
) -> Notification:
    notification = Notification(
        recipient_user_id=recipient_user_id,
        team_id=team_id,
        kind=kind,
        title=title,
        body=body,
        is_read=False,
        ref_id=ref_id,
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification


async def list_notifications(
    db: AsyncSession,
    user_id: UUID,
    *,
    unread_only: bool = False,
    limit: int = 50,
) -> list[Notification]:
    stmt = (
        select(Notification)
        .where(Notification.recipient_user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    if unread_only:
        stmt = stmt.where(Notification.is_read == False)  # noqa: E712
    return list((await db.execute(stmt)).scalars())


async def mark_read(
    db: AsyncSession,
    user_id: UUID,
    ids: list[UUID],
) -> int:
    if not ids:
        return 0
    stmt = (
        update(Notification)
        .where(
            Notification.recipient_user_id == user_id,
            Notification.id.in_(ids),
        )
        .values(is_read=True)
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount


async def unread_count(
    db: AsyncSession,
    user_id: UUID,
) -> int:
    stmt = select(func.count()).where(
        Notification.recipient_user_id == user_id,
        Notification.is_read == False,  # noqa: E712
    )
    return (await db.execute(stmt)).scalar_one()
