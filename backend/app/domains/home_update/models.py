from datetime import datetime
from enum import StrEnum
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class HomeUpdateStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"


class HomeUpdate(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "home_update"
    __table_args__ = (
        Index("ix_home_update_team_id_status", "team_id", "status"),
        Index("ix_home_update_team_id_published_at", "team_id", "published_at"),
    )

    team_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("team.id", ondelete="CASCADE"),
        nullable=False,
    )
    author_user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status: Mapped[HomeUpdateStatus] = mapped_column(
        Enum(
            HomeUpdateStatus,
            name="home_update_status",
            native_enum=False,
            length=16,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        default=HomeUpdateStatus.DRAFT,
        server_default=HomeUpdateStatus.DRAFT.value,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(String(10000), nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
