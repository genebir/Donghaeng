from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.domains.expense.models import ExpenseCategory


class BudgetEntryIn(BaseModel):
    category: ExpenseCategory
    planned_amount: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    currency: str = Field(default="KRW", min_length=3, max_length=3)
    notes: str | None = Field(default=None, max_length=2000)


class BudgetUpsert(BaseModel):
    """팀 예산 일괄 upsert. body에 없는 카테고리는 그대로 유지됨."""

    entries: list[BudgetEntryIn] = Field(min_length=1)


class BudgetEntryPublic(BaseModel):
    id: UUID
    team_id: UUID
    category: ExpenseCategory
    planned_amount: Decimal
    currency: str
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BudgetCategorySummary(BaseModel):
    """예산 + 카테고리별 실집행. spent는 Numeric 합계 → JSON string."""

    category: ExpenseCategory
    planned_amount: Decimal
    spent_approved: Decimal
    spent_pending: Decimal
    remaining: Decimal
    currency: str


class BudgetSummaryMeta(BaseModel):
    total_planned: Decimal
    total_spent_approved: Decimal
    total_spent_pending: Decimal


class BudgetSummary(BaseModel):
    data: list[BudgetCategorySummary]
    meta: BudgetSummaryMeta
