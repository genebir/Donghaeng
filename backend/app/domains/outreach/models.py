from datetime import date
from enum import StrEnum
from uuid import UUID

from sqlalchemy import Date, Enum, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class Outreach(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "outreach"
    __table_args__ = (
        Index("ix_outreach_organization_id_year", "organization_id", "year"),
    )

    organization_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("organization.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    starts_on: Mapped[date | None] = mapped_column(Date)
    ends_on: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(String(2000))


class OutreachRole(StrEnum):
    DIRECTOR = "DIRECTOR"  # 디렉터: 아웃리치 전체 관리
    STAFF = "STAFF"        # 사역자: 특정 팀 관리


class OutreachMembership(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "outreach_membership"
    __table_args__ = (
        UniqueConstraint("outreach_id", "user_id", name="uq_outreach_membership_outreach_user"),
        Index("ix_outreach_membership_user_id", "user_id"),
    )

    outreach_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("outreach.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[OutreachRole] = mapped_column(
        Enum(OutreachRole, name="outreach_role", native_enum=False, length=16),
        nullable=False,
    )
    # team_id: STAFF 역할 시 담당 팀, DIRECTOR는 NULL
    team_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("team.id", ondelete="SET NULL"),
        nullable=True,
    )
