from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.domains.auth.schemas import UserPublic
from app.domains.member.models import TeamPart, TeamRole


class TeamMemberAdd(BaseModel):
    """이메일로 기존 가입 유저를 팀에 추가. 추후 invite token 흐름으로 확장."""

    email: EmailStr
    role: TeamRole = TeamRole.MEMBER
    part: TeamPart | None = None
    is_part_lead: bool = False


class TeamMemberUpdate(BaseModel):
    role: TeamRole | None = None
    part: TeamPart | None = None
    is_part_lead: bool | None = None
    emergency_info: dict[str, Any] | None = None
    meta: dict[str, Any] | None = None


class TeamMemberPublic(BaseModel):
    id: UUID
    team_id: UUID
    user: UserPublic
    role: TeamRole
    part: TeamPart | None = None
    is_part_lead: bool
    emergency_info: dict[str, Any] | None = None
    meta: dict[str, Any] | None = None
    joined_at: datetime = Field(
        validation_alias="created_at",
        serialization_alias="joined_at",
    )

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
    }
