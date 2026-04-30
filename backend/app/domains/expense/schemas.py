from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.domains.expense.models import (
    ExpenseCategory,
    ExpenseStatus,
    PaymentMethod,
)


class ExpenseCreate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    currency: str = Field(default="KRW", min_length=3, max_length=3)
    spent_at: datetime
    vendor: str | None = Field(default=None, max_length=200)
    category: ExpenseCategory
    description: str = Field(min_length=1, max_length=500)
    payment_method: PaymentMethod | None = None
    receipt_media_id: UUID | None = None
    checklist_item_id: UUID | None = None
    ocr_raw: dict[str, Any] | None = None
    notes: str | None = Field(default=None, max_length=2000)
    # 본인 외 등록 (admin/회계 전용). 비-admin이 보내면 라우터에서 무시 + 자기로 강제.
    purchaser_user_id: UUID | None = None


class ExpenseUpdate(BaseModel):
    amount: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    spent_at: datetime | None = None
    vendor: str | None = Field(default=None, max_length=200)
    category: ExpenseCategory | None = None
    description: str | None = Field(default=None, min_length=1, max_length=500)
    payment_method: PaymentMethod | None = None
    receipt_media_id: UUID | None = None
    checklist_item_id: UUID | None = None
    ocr_raw: dict[str, Any] | None = None
    notes: str | None = Field(default=None, max_length=2000)


class ExpenseRejectIn(BaseModel):
    reason: str = Field(min_length=1, max_length=500)


class ExpensePublic(BaseModel):
    id: UUID
    team_id: UUID
    purchaser_user_id: UUID
    amount: Decimal
    currency: str
    spent_at: datetime
    vendor: str | None = None
    category: ExpenseCategory
    description: str
    payment_method: PaymentMethod | None = None
    receipt_media_id: UUID | None = None
    checklist_item_id: UUID | None = None
    ocr_raw: dict[str, Any] | None = None
    status: ExpenseStatus
    approved_by_user_id: UUID | None = None
    approved_at: datetime | None = None
    rejection_reason: str | None = None
    reimbursement_id: UUID | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
