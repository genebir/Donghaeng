from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Any
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class ExpenseCategory(StrEnum):
    TRANSPORT = "TRANSPORT"
    LODGING = "LODGING"
    MEAL = "MEAL"
    MINISTRY = "MINISTRY"
    GIFT = "GIFT"
    SUPPLIES = "SUPPLIES"
    MEDICAL = "MEDICAL"
    MISC = "MISC"


class ExpenseStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REIMBURSED = "reimbursed"


class PaymentMethod(StrEnum):
    PERSONAL_CARD = "PERSONAL_CARD"
    PERSONAL_CASH = "PERSONAL_CASH"
    CHURCH_CARD = "CHURCH_CARD"
    OTHER = "OTHER"


class Expense(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "expense"

    team_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("team.id", ondelete="CASCADE"),
        nullable=False,
    )
    purchaser_user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="KRW",
        server_default="KRW",
    )
    spent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    vendor: Mapped[str | None] = mapped_column(String(200))
    category: Mapped[ExpenseCategory] = mapped_column(
        Enum(
            ExpenseCategory,
            name="expense_category",
            native_enum=False,
            length=16,
        ),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    payment_method: Mapped[PaymentMethod | None] = mapped_column(
        Enum(
            PaymentMethod,
            name="payment_method",
            native_enum=False,
            length=24,
        )
    )
    receipt_media_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True))
    checklist_item_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("checklist_item.id", ondelete="SET NULL"),
    )
    ocr_raw: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    status: Mapped[ExpenseStatus] = mapped_column(
        Enum(
            ExpenseStatus,
            name="expense_status",
            native_enum=False,
            length=16,
            values_callable=lambda enum: [member.value for member in enum],
        ),
        nullable=False,
        default=ExpenseStatus.PENDING,
        server_default=ExpenseStatus.PENDING.value,
    )
    approved_by_user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user.id", ondelete="SET NULL"),
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejection_reason: Mapped[str | None] = mapped_column(String(500))
    reimbursement_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True))
    notes: Mapped[str | None] = mapped_column(String(2000))

    __table_args__ = (
        Index("ix_expense_team_id_status", "team_id", "status"),
        Index(
            "ix_expense_team_id_purchaser_status",
            "team_id",
            "purchaser_user_id",
            "status",
        ),
        Index("ix_expense_team_id_category", "team_id", "category"),
        Index(
            "ix_expense_team_id_spent_at",
            "team_id",
            "spent_at",
        ),
    )
