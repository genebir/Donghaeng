from decimal import Decimal
from uuid import UUID

from sqlalchemy import Enum, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.domains.expense.models import ExpenseCategory


class Budget(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "budget"

    team_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("team.id", ondelete="CASCADE"),
        nullable=False,
    )
    category: Mapped[ExpenseCategory] = mapped_column(
        Enum(
            ExpenseCategory,
            name="expense_category",
            native_enum=False,
            length=16,
            create_type=False,
        ),
        nullable=False,
    )
    planned_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="KRW",
        server_default="KRW",
    )
    notes: Mapped[str | None] = mapped_column(String(2000))

    __table_args__ = (
        UniqueConstraint("team_id", "category", name="uq_budget_team_category"),
    )
