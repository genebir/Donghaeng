from enum import StrEnum
from uuid import UUID

from sqlalchemy import Boolean, Enum, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class NotificationKind(StrEnum):
    EXPENSE_APPROVED = "expense_approved"
    EXPENSE_REJECTED = "expense_rejected"
    REIMBURSEMENT_CONFIRMED = "reimbursement_confirmed"
    REIMBURSEMENT_COMPLETED = "reimbursement_completed"
    TESTIMONY_NEW = "testimony_new"
    MEMBER_JOINED = "member_joined"


class Notification(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "notification"
    __table_args__ = (
        Index("ix_notification_recipient_is_read", "recipient_user_id", "is_read"),
        Index("ix_notification_recipient_created_at", "recipient_user_id", "created_at"),
    )

    recipient_user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    team_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("team.id", ondelete="CASCADE"),
        nullable=False,
    )
    kind: Mapped[NotificationKind] = mapped_column(
        Enum(
            NotificationKind,
            name="notification_kind",
            native_enum=False,
            length=40,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    ref_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        nullable=True,
    )
