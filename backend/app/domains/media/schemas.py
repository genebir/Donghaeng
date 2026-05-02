from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.domains.media.models import MediaKind, MediaStatus, MediaVisibility


class MediaPresignIn(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=128)
    byte_size: int | None = None


class MediaPresignOut(BaseModel):
    media_id: UUID
    upload_url: str
    method: str = "PUT"
    expires_in: int = 600


class MediaAssetPublic(BaseModel):
    id: UUID
    team_id: UUID
    uploader_user_id: UUID
    status: MediaStatus
    kind: MediaKind
    filename: str
    content_type: str
    byte_size: int | None
    visibility: MediaVisibility
    is_selected: bool
    notes: str | None
    view_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MediaUpdate(BaseModel):
    visibility: MediaVisibility | None = None
    is_selected: bool | None = None
    notes: str | None = None
