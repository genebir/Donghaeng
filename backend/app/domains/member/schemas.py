from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.domains.auth.schemas import UserPublic
from app.domains.member.models import TeamPart, TeamRole


class TeamMemberAdd(BaseModel):
    """이메일 또는 user_id로 기존 가입 유저를 팀에 추가."""

    email: str | None = Field(default=None, max_length=254)
    user_id: UUID | None = None  # 카카오 synthetic 이메일 우회용
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
