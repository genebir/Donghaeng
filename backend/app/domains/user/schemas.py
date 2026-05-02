from uuid import UUID

from pydantic import BaseModel, Field

from app.domains.member.models import TeamPart, TeamRole
from app.domains.outreach.models import OutreachRole


class OutreachMembershipSummary(BaseModel):
    outreach_id: UUID
    outreach_name: str
    role: OutreachRole
    team_id: UUID | None = None
    team_name: str | None = None


class TeamMembershipSummary(BaseModel):
    team_id: UUID
    team_name: str
    outreach_name: str
    role: TeamRole
    part: TeamPart | None = None
    is_part_lead: bool = False


class UserProfilePublic(BaseModel):
    id: UUID
    name: str
    email: str
    profile_image_url: str | None = None
    phone: str | None = None
    bank_name: str | None = None
    bank_account_number_masked: str | None = None  # last 4 digits only, e.g. "****1234"
    bank_account_holder: str | None = None
    org_role: str | None = None  # OrgRole 값 또는 None
    outreach_memberships: list[OutreachMembershipSummary] = []
    team_memberships: list[TeamMembershipSummary] = []

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=32)
    bank_name: str | None = Field(default=None, max_length=64)
    bank_account_number: str | None = Field(default=None, max_length=40)
    bank_account_holder: str | None = Field(default=None, max_length=120)


class UserBankInfoPublic(BaseModel):
    user_id: UUID
    name: str
    bank_name: str | None = None
    bank_account_number: str | None = None  # 복호화된 실제 계좌번호
    bank_account_holder: str | None = None
