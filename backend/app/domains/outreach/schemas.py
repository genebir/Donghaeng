from datetime import date, datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.domains.auth.schemas import UserPublic
from app.domains.outreach.models import OutreachRole


class OutreachCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    year: int = Field(ge=2000, le=2100)
    starts_on: date | None = None
    ends_on: date | None = None
    description: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def _date_order(self) -> Self:
        if self.starts_on and self.ends_on and self.ends_on < self.starts_on:
            raise ValueError("ends_on은 starts_on보다 빠를 수 없습니다.")
        return self


class OutreachUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    year: int | None = Field(default=None, ge=2000, le=2100)
    starts_on: date | None = None
    ends_on: date | None = None
    description: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def _date_order(self) -> Self:
        if self.starts_on and self.ends_on and self.ends_on < self.starts_on:
            raise ValueError("ends_on은 starts_on보다 빠를 수 없습니다.")
        return self


class OutreachPublic(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    year: int
    starts_on: date | None = None
    ends_on: date | None = None
    description: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class OutreachMembershipCreate(BaseModel):
    user_id: UUID
    role: OutreachRole
    team_id: UUID | None = None  # STAFF 역할 시 필수


class OutreachMembershipPublic(BaseModel):
    id: UUID
    outreach_id: UUID
    user_id: UUID
    user: UserPublic
    role: OutreachRole
    team_id: UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}
