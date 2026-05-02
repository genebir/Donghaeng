from typing import Any

from fastapi import APIRouter, status

from app.deps import CurrentUser, DbSession
from app.domains.notification import service
from app.domains.notification.models import Notification
from app.domains.notification.schemas import NotificationMarkRead, NotificationPublic

router = APIRouter(
    prefix="/notifications",
    tags=["notification"],
)


def _notification_dict(n: Notification) -> dict[str, Any]:
    return NotificationPublic.model_validate(n).model_dump(mode="json")


@router.get("")
async def list_notifications(
    user: CurrentUser,
    db: DbSession,
    unread_only: bool = False,
) -> dict[str, Any]:
    notifications = await service.list_notifications(db, user.id, unread_only=unread_only)
    count = await service.unread_count(db, user.id)
    return {
        "data": [_notification_dict(n) for n in notifications],
        "meta": {"unread_count": count},
    }


@router.get("/unread-count")
async def get_unread_count(
    user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    count = await service.unread_count(db, user.id)
    return {"data": {"count": count}}


@router.post("/mark-read", status_code=status.HTTP_200_OK)
async def mark_read(
    payload: NotificationMarkRead,
    user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    marked = await service.mark_read(db, user.id, payload.ids)
    return {"data": {"marked": marked}}
