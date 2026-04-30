from datetime import date
from enum import StrEnum
from uuid import UUID

from sqlalchemy import Date, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class TeamStatus(StrEnum):
    PLANNING = "planning"
    ONGOING = "ongoing"
    FINISHED = "finished"
    ARCHIVED = "archived"


class Team(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "team"
    __table_args__ = (
        UniqueConstraint("outreach_id", "slug", name="uq_team_outreach_slug"),
    )

    outreach_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("outreach.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(64), nullable=False)
    starts_on: Mapped[date | None] = mapped_column(Date)
    ends_on: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(String(2000))
    status: Mapped[TeamStatus] = mapped_column(
        Enum(
            TeamStatus,
            name="team_status",
            native_enum=False,
            length=16,
            # StrEnum의 .value를 DB에 저장 (DATABASE.md: planning/ongoing/...)
            values_callable=lambda enum: [member.value for member in enum],
        ),
        nullable=False,
        default=TeamStatus.PLANNING,
        server_default=TeamStatus.PLANNING.value,
    )


class Destination(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "destination"
    # 팀당 1곳 (1:1).
    team_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("team.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    church_name: Mapped[str] = mapped_column(String(120), nullable=False)
    address: Mapped[str | None] = mapped_column(String(255))
    coordinator_name: Mapped[str | None] = mapped_column(String(120))
    coordinator_phone: Mapped[str | None] = mapped_column(String(32))
    coordinator_email: Mapped[str | None] = mapped_column(String(320))
    timezone: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="Asia/Seoul",
        server_default="Asia/Seoul",
    )
    notes: Mapped[str | None] = mapped_column(String(2000))
