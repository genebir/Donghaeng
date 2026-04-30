from datetime import date
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from sqlalchemy import Date, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class ChecklistCategory(StrEnum):
    TEAM_GEAR = "TEAM_GEAR"
    PERSONAL = "PERSONAL"
    MINISTRY = "MINISTRY"
    DOCS = "DOCS"
    MISC = "MISC"


class ChecklistStatus(StrEnum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class ChecklistItem(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "checklist_item"

    team_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("team.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category: Mapped[ChecklistCategory] = mapped_column(
        Enum(
            ChecklistCategory,
            name="checklist_category",
            native_enum=False,
            length=16,
        ),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[str | None] = mapped_column(String(64))
    owner_member_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("team_member.id", ondelete="SET NULL"),
    )
    due_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[ChecklistStatus] = mapped_column(
        Enum(
            ChecklistStatus,
            name="checklist_status",
            native_enum=False,
            length=16,
            values_callable=lambda enum: [member.value for member in enum],
        ),
        nullable=False,
        default=ChecklistStatus.TODO,
        server_default=ChecklistStatus.TODO.value,
    )
    cost_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    cost_currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="KRW",
        server_default="KRW",
    )
    notes: Mapped[str | None] = mapped_column(String(2000))
