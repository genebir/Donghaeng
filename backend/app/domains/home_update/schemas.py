from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.domains.home_update.models import HomeUpdateStatus


class HomeUpdatePublic(BaseModel):
    id: UUID
    team_id: UUID
    author_user_id: UUID
    status: HomeUpdateStatus
    title: str
    content: str
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class HomeUpdateCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=10000)


class HomeUpdateUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1, max_length=10000)
