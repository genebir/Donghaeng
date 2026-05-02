from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class ReimbursementStatus(StrEnum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"


class Reimbursement(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "reimbursement"

    team_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("team.id", ondelete="CASCADE"),
        nullable=False,
    )
    recipient_user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=False,
    )
    created_by_user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status: Mapped[ReimbursementStatus] = mapped_column(
        Enum(
            ReimbursementStatus,
            name="reimbursement_status",
            native_enum=False,
            length=16,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        default=ReimbursementStatus.DRAFT,
        server_default="draft",
    )
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0"),
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="KRW",
        server_default="KRW",
    )
    transfer_method: Mapped[str | None] = mapped_column(String(64))
    transfer_reference: Mapped[str | None] = mapped_column(String(500))
    notes: Mapped[str | None] = mapped_column(String(2000))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        Index("ix_reimbursement_team_id_status", "team_id", "status"),
        Index("ix_reimbursement_team_id_recipient", "team_id", "recipient_user_id"),
    )
