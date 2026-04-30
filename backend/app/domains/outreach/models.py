from datetime import date
from uuid import UUID

from sqlalchemy import Date, ForeignKey, Index, Integer, String
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
