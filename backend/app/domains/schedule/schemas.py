from datetime import datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.domains.schedule.models import ScheduleKind


class ScheduleItemCreate(BaseModel):
    starts_at: datetime
    ends_at: datetime | None = None
    title: str = Field(min_length=1, max_length=200)
    kind: ScheduleKind | None = None
    location: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    owner_member_id: UUID | None = None

    @model_validator(mode="after")
    def _time_order(self) -> Self:
        if self.ends_at and self.ends_at < self.starts_at:
            raise ValueError("ends_at은 starts_at보다 빠를 수 없습니다.")
        return self


class ScheduleItemUpdate(BaseModel):
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    kind: ScheduleKind | None = None
    location: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    owner_member_id: UUID | None = None

    @model_validator(mode="after")
    def _time_order(self) -> Self:
        if self.starts_at and self.ends_at and self.ends_at < self.starts_at:
            raise ValueError("ends_at은 starts_at보다 빠를 수 없습니다.")
        return self


class ScheduleItemPublic(BaseModel):
    id: UUID
    team_id: UUID
    starts_at: datetime
    ends_at: datetime | None = None
    title: str
    kind: ScheduleKind | None = None
    location: str | None = None
    description: str | None = None
    owner_member_id: UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
