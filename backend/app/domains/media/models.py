from enum import StrEnum
from uuid import UUID

from sqlalchemy import BigInteger, Boolean, Enum, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class MediaKind(StrEnum):
    PHOTO = "photo"
    VIDEO = "video"
    DOCUMENT = "document"


class MediaStatus(StrEnum):
    PENDING = "pending"
    READY = "ready"
    FAILED = "failed"


class MediaVisibility(StrEnum):
    TEAM = "team"
    PUBLIC = "public"


class MediaAsset(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "media_asset"

    team_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("team.id", ondelete="CASCADE"),
        nullable=False,
    )
    uploader_user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status: Mapped[MediaStatus] = mapped_column(
        Enum(
            MediaStatus,
            name="media_status",
            native_enum=False,
            length=16,
            values_callable=lambda enum: [member.value for member in enum],
        ),
        nullable=False,
        default=MediaStatus.PENDING,
        server_default=MediaStatus.PENDING.value,
    )
    kind: Mapped[MediaKind] = mapped_column(
        Enum(
            MediaKind,
            name="media_kind",
            native_enum=False,
            length=16,
            values_callable=lambda enum: [member.value for member in enum],
        ),
        nullable=False,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    content_type: Mapped[str] = mapped_column(String(128), nullable=False)
    byte_size: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    visibility: Mapped[MediaVisibility] = mapped_column(
        Enum(
            MediaVisibility,
            name="media_visibility",
            native_enum=False,
            length=16,
            values_callable=lambda enum: [member.value for member in enum],
        ),
        nullable=False,
        default=MediaVisibility.TEAM,
        server_default=MediaVisibility.TEAM.value,
    )
    is_selected: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    __table_args__ = (
        Index("ix_media_asset_team_id_status", "team_id", "status"),
        Index("ix_media_asset_team_id_visibility", "team_id", "visibility"),
    )
