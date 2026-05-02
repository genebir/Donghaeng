from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.domains.notification.models import NotificationKind


class NotificationPublic(BaseModel):
    id: UUID
    recipient_user_id: UUID
    team_id: UUID
    kind: NotificationKind
    title: str
    body: str | None
    is_read: bool
    ref_id: UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationMarkRead(BaseModel):
    ids: list[UUID]
