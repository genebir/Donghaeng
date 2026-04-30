from datetime import datetime
from enum import StrEnum
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class ScheduleKind(StrEnum):
    TRAVEL = "TRAVEL"
    WORSHIP = "WORSHIP"
    VBS = "VBS"
    MEAL = "MEAL"
    FREE = "FREE"
    PRAYER = "PRAYER"
    MEETING = "MEETING"
    OTHER = "OTHER"


class ScheduleItem(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "schedule_item"
    __table_args__ = (
        Index("ix_schedule_item_team_id_starts_at", "team_id", "starts_at"),
    )

    team_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("team.id", ondelete="CASCADE"),
        nullable=False,
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    kind: Mapped[ScheduleKind | None] = mapped_column(
        Enum(ScheduleKind, name="schedule_kind", native_enum=False, length=16),
    )
    location: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String(2000))
    owner_member_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("team_member.id", ondelete="SET NULL"),
    )
