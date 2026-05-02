from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.domains.expense.schemas import ExpensePublic
from app.domains.reimbursement.models import ReimbursementStatus


class ReimbursementPublic(BaseModel):
    id: UUID
    team_id: UUID
    recipient_user_id: UUID
    created_by_user_id: UUID
    status: ReimbursementStatus
    total_amount: Decimal
    currency: str
    transfer_method: str | None
    transfer_reference: str | None
    notes: str | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    expenses: list[ExpensePublic] = []

    # Populated from User table in service layer (not on the Reimbursement model)
    recipient_name: str | None = None
    recipient_bank_name: str | None = None
    recipient_bank_account_holder: str | None = None
    recipient_bank_account_number_masked: str | None = None

    model_config = {"from_attributes": True}


class ReimbursementCreate(BaseModel):
    recipient_user_id: UUID
    include_expense_ids: list[UUID] | None = None  # None = all approved unreimbursed for recipient


class ReimbursementComplete(BaseModel):
    transfer_method: str = Field(max_length=64)
    transfer_reference: str = Field(max_length=500)
    notes: str | None = Field(default=None, max_length=2000)
