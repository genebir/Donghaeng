from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.domains.testimony.models import TestimonyKind, TestimonyVisibility


class QrTokenPublic(BaseModel):
    id: UUID
    team_id: UUID
    token: str
    label: str | None
    expires_at: datetime | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class QrTokenCreate(BaseModel):
    label: str | None = Field(default=None, max_length=120)


class TestimonyPublic(BaseModel):
    id: UUID
    team_id: UUID
    qr_token_id: UUID | None
    submitter_user_id: UUID | None
    kind: TestimonyKind
    visibility: TestimonyVisibility
    content: str
    is_featured: bool
    submitted_name: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TestimonyCreate(BaseModel):
    kind: TestimonyKind
    visibility: TestimonyVisibility = TestimonyVisibility.TEAM
    content: str = Field(min_length=1, max_length=5000)
    submitted_name: str | None = Field(default=None, max_length=80)


class AnonymousTestimonyCreate(BaseModel):
    kind: TestimonyKind = TestimonyKind.PRAYER_REQUEST
    content: str = Field(min_length=1, max_length=5000)
    submitted_name: str | None = Field(default=None, max_length=80)


class TestimonyUpdate(BaseModel):
    visibility: TestimonyVisibility | None = None
    is_featured: bool | None = None
    content: str | None = Field(default=None, min_length=1, max_length=5000)
