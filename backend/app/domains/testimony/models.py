from datetime import datetime
from enum import StrEnum
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class TestimonyKind(StrEnum):
    TESTIMONY = "testimony"
    PRAYER_REQUEST = "prayer_request"


class TestimonyVisibility(StrEnum):
    TEAM = "team"
    PUBLIC = "public"
    ANONYMOUS = "anonymous"


class QrToken(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "qr_token"
    __table_args__ = (
        Index("ix_qr_token_team_id", "team_id"),
    )

    team_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("team.id", ondelete="CASCADE"),
        nullable=False,
    )
    token: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        unique=True,
        index=True,
    )
    label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )


class Testimony(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "testimony"
    __table_args__ = (
        Index("ix_testimony_team_id_visibility", "team_id", "visibility"),
        Index("ix_testimony_team_id_kind", "team_id", "kind"),
    )

    team_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("team.id", ondelete="CASCADE"),
        nullable=False,
    )
    qr_token_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("qr_token.id", ondelete="SET NULL"),
        nullable=True,
    )
    submitter_user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
    )
    kind: Mapped[TestimonyKind] = mapped_column(
        Enum(
            TestimonyKind,
            name="testimony_kind",
            native_enum=False,
            length=32,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
    )
    visibility: Mapped[TestimonyVisibility] = mapped_column(
        Enum(
            TestimonyVisibility,
            name="testimony_visibility",
            native_enum=False,
            length=16,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        default=TestimonyVisibility.TEAM,
        server_default=TestimonyVisibility.TEAM.value,
    )
    content: Mapped[str] = mapped_column(String(5000), nullable=False)
    is_featured: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    submitted_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
