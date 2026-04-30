from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.domains.checklist.models import ChecklistCategory, ChecklistStatus


class ChecklistItemCreate(BaseModel):
    category: ChecklistCategory
    title: str = Field(min_length=1, max_length=200)
    quantity: str | None = Field(default=None, max_length=64)
    owner_member_id: UUID | None = None
    due_date: date | None = None
    status: ChecklistStatus = ChecklistStatus.TODO
    cost_amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    cost_currency: str = Field(default="KRW", min_length=3, max_length=3)
    notes: str | None = Field(default=None, max_length=2000)


class ChecklistItemUpdate(BaseModel):
    category: ChecklistCategory | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    quantity: str | None = Field(default=None, max_length=64)
    owner_member_id: UUID | None = None
    due_date: date | None = None
    status: ChecklistStatus | None = None
    cost_amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    cost_currency: str | None = Field(default=None, min_length=3, max_length=3)
    notes: str | None = Field(default=None, max_length=2000)


class ChecklistItemPublic(BaseModel):
    id: UUID
    team_id: UUID
    category: ChecklistCategory
    title: str
    quantity: str | None = None
    owner_member_id: UUID | None = None
    due_date: date | None = None
    status: ChecklistStatus
    cost_amount: Decimal | None = None
    cost_currency: str
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
