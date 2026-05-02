import re
from datetime import date, datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.domains.team.models import TeamStatus

SLUG_PATTERN = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$")


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    slug: str = Field(min_length=2, max_length=64)
    starts_on: date | None = None
    ends_on: date | None = None
    description: str | None = Field(default=None, max_length=2000)

    @field_validator("slug")
    @classmethod
    def _slug_format(cls, v: str) -> str:
        if not SLUG_PATTERN.match(v):
            raise ValueError(
                "slug은 소문자/숫자/하이픈만, 양 끝은 alphanum이어야 합니다."
            )
        return v

    @model_validator(mode="after")
    def _date_order(self) -> Self:
        if self.starts_on and self.ends_on and self.ends_on < self.starts_on:
            raise ValueError("ends_on은 starts_on보다 빠를 수 없습니다.")
        return self


class TeamUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    starts_on: date | None = None
    ends_on: date | None = None
    description: str | None = Field(default=None, max_length=2000)
    status: TeamStatus | None = None
    # slug은 의도적으로 변경 불가 — 공유 URL 깨짐 방지

    @model_validator(mode="after")
    def _date_order(self) -> Self:
        if self.starts_on and self.ends_on and self.ends_on < self.starts_on:
            raise ValueError("ends_on은 starts_on보다 빠를 수 없습니다.")
        return self


class TeamPublic(BaseModel):
    id: UUID
    outreach_id: UUID
    name: str
    slug: str
    status: TeamStatus
    starts_on: date | None = None
    ends_on: date | None = None
    description: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DestinationUpsert(BaseModel):
    church_name: str = Field(min_length=1, max_length=120)
    address: str | None = Field(default=None, max_length=255)
    coordinator_name: str | None = Field(default=None, max_length=120)
    coordinator_phone: str | None = Field(default=None, max_length=32)
    coordinator_email: str | None = Field(default=None, max_length=254)
    timezone: str = Field(default="Asia/Seoul", min_length=1, max_length=64)
    notes: str | None = Field(default=None, max_length=2000)


class DestinationPublic(BaseModel):
    id: UUID
    team_id: UUID
    church_name: str
    address: str | None = None
    coordinator_name: str | None = None
    coordinator_phone: str | None = None
    coordinator_email: str | None = None
    timezone: str
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TeamDetail(TeamPublic):
    """GET /teams/{id} 응답 — destination 임베드. member_count 등은 추후."""

    destination: DestinationPublic | None = None
