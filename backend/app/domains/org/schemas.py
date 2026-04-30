import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.domains.auth.schemas import UserPublic
from app.domains.org.models import ChurchPosition, OrgRole

SLUG_PATTERN = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$")
HEX_COLOR_PATTERN = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")


class OrgCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    slug: str = Field(min_length=2, max_length=64)
    logo_url: str | None = Field(default=None, max_length=1024)
    primary_color: str | None = Field(default=None, max_length=16)

    @field_validator("slug")
    @classmethod
    def _slug_format(cls, v: str) -> str:
        if not SLUG_PATTERN.match(v):
            raise ValueError(
                "slug은 소문자/숫자/하이픈만, 양 끝은 alphanum이어야 합니다."
            )
        return v

    @field_validator("primary_color")
    @classmethod
    def _color_format(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not HEX_COLOR_PATTERN.match(v):
            raise ValueError("primary_color는 #RGB 또는 #RRGGBB 형식이어야 합니다.")
        return v


class OrgUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    logo_url: str | None = Field(default=None, max_length=1024)
    primary_color: str | None = Field(default=None, max_length=16)

    @field_validator("primary_color")
    @classmethod
    def _color_format(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not HEX_COLOR_PATTERN.match(v):
            raise ValueError("primary_color는 #RGB 또는 #RRGGBB 형식이어야 합니다.")
        return v


class OrgPublic(BaseModel):
    id: UUID
    name: str
    slug: str
    logo_url: str | None = None
    primary_color: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class OrgMembershipPublic(BaseModel):
    id: UUID
    user: UserPublic
    role: OrgRole
    church_position: ChurchPosition | None = None
    village_name: str | None = None
    created_at: datetime  # 조직 가입 시점
