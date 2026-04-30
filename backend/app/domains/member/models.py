from enum import StrEnum
from typing import Any
from uuid import UUID

from sqlalchemy import Boolean, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class TeamRole(StrEnum):
    """팀 내 역할. DATABASE.md '단순화'를 따라 두 단계만."""

    LEADER = "LEADER"
    MEMBER = "MEMBER"


class TeamPart(StrEnum):
    """팀 내 부서/파트. DATABASE.md 그대로."""

    MEDIA = "MEDIA"
    WORSHIP = "WORSHIP"
    TEACHER = "TEACHER"
    FINANCE = "FINANCE"
    MEDICAL = "MEDICAL"
    GENERAL = "GENERAL"


class TeamMember(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "team_member"
    __table_args__ = (
        UniqueConstraint("team_id", "user_id", name="uq_team_member_team_user"),
    )

    team_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("team.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[TeamRole] = mapped_column(
        Enum(TeamRole, name="team_role", native_enum=False, length=16),
        nullable=False,
        default=TeamRole.MEMBER,
        server_default=TeamRole.MEMBER.value,
    )
    part: Mapped[TeamPart | None] = mapped_column(
        Enum(TeamPart, name="team_part", native_enum=False, length=16),
    )
    is_part_lead: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    # NOTE: 응급정보 / 추가 메타. v0에서는 모든 팀원에게 노출 — 추후 audit_log + 접근 제어 필요.
    emergency_info: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    meta: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
