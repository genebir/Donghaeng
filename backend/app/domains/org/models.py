from enum import StrEnum
from uuid import UUID

from sqlalchemy import Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class OrgRole(StrEnum):
    """조직 내 시스템 권한."""

    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"


class ChurchPosition(StrEnum):
    """우리들교회 표시용 직분 (권한 무관)."""

    VILLAGE_HEAD = "VILLAGE_HEAD"  # 마을장
    SHEPHERD = "SHEPHERD"  # 목자
    VICE_SHEPHERD = "VICE_SHEPHERD"  # 부목자
    SHEEP = "SHEEP"  # 목원
    OTHER = "OTHER"


class Organization(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "organization"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(1024))
    primary_color: Mapped[str | None] = mapped_column(String(16))


class OrgMembership(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "org_membership"
    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", name="uq_org_membership_org_user"),
    )

    organization_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("organization.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[OrgRole] = mapped_column(
        Enum(OrgRole, name="org_role", native_enum=False, length=16),
        nullable=False,
        default=OrgRole.MEMBER,
    )
    church_position: Mapped[ChurchPosition | None] = mapped_column(
        Enum(ChurchPosition, name="church_position", native_enum=False, length=16),
    )
    village_name: Mapped[str | None] = mapped_column(String(64))
