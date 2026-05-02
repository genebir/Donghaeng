from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.encryption import decrypt_bank, encrypt_bank
from app.domains.member.models import TeamMember
from app.domains.org.models import OrgMembership
from app.domains.outreach.models import Outreach, OutreachMembership
from app.domains.team.models import Team
from app.domains.user.models import User
from app.domains.user.schemas import (
    OutreachMembershipSummary,
    TeamMembershipSummary,
    UserBankInfoPublic,
    UserProfilePublic,
    UserProfileUpdate,
)


def _mask_account_number(encrypted: str, key: str | None) -> str:
    """Decrypt the stored account number and return the last-4 masked form."""
    try:
        plaintext = decrypt_bank(encrypted, key or "")
        last4 = plaintext[-4:] if len(plaintext) >= 4 else plaintext
        return f"****{last4}"
    except Exception:
        return "****"


async def get_profile(
    db: AsyncSession, user: User, key: str | None
) -> UserProfilePublic:
    masked: str | None = None
    if user.bank_account_number:
        masked = _mask_account_number(user.bank_account_number, key)

    # OrgMembership 조회 (첫 번째 조직 기준 — 단일 조직 가정)
    org_membership = (
        await db.execute(
            select(OrgMembership).where(OrgMembership.user_id == user.id)
        )
    ).scalar_one_or_none()
    org_role: str | None = org_membership.role.value if org_membership else None

    # OutreachMembership + Outreach join 조회
    om_rows = (
        await db.execute(
            select(OutreachMembership, Outreach, Team)
            .join(Outreach, Outreach.id == OutreachMembership.outreach_id)
            .outerjoin(Team, Team.id == OutreachMembership.team_id)
            .where(OutreachMembership.user_id == user.id)
        )
    ).all()
    outreach_memberships = [
        OutreachMembershipSummary(
            outreach_id=om.outreach_id,
            outreach_name=outreach.name,
            role=om.role,
            team_id=om.team_id,
            team_name=team.name if team else None,
        )
        for om, outreach, team in om_rows
    ]

    # TeamMember + Team + Outreach join 조회
    tm_rows = (
        await db.execute(
            select(TeamMember, Team, Outreach)
            .join(Team, Team.id == TeamMember.team_id)
            .join(Outreach, Outreach.id == Team.outreach_id)
            .where(TeamMember.user_id == user.id)
        )
    ).all()
    team_memberships = [
        TeamMembershipSummary(
            team_id=tm.team_id,
            team_name=team.name,
            outreach_name=outreach.name,
            role=tm.role,
            part=tm.part,
            is_part_lead=tm.is_part_lead,
        )
        for tm, team, outreach in tm_rows
    ]

    return UserProfilePublic(
        id=user.id,
        name=user.name,
        email=user.email,
        profile_image_url=user.profile_image_url,
        phone=user.phone,
        bank_name=user.bank_name,
        bank_account_number_masked=masked,
        bank_account_holder=user.bank_account_holder,
        org_role=org_role,
        outreach_memberships=outreach_memberships,
        team_memberships=team_memberships,
    )


async def get_bank_info_by_id(
    db: AsyncSession, user_id: UUID, key: str | None
) -> UserBankInfoPublic:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자를 찾을 수 없습니다.")
    account_number: str | None = None
    if user.bank_account_number:
        try:
            account_number = decrypt_bank(user.bank_account_number, key or "")
        except Exception:
            account_number = None
    return UserBankInfoPublic(
        user_id=user.id,
        name=user.name,
        bank_name=user.bank_name,
        bank_account_number=account_number,
        bank_account_holder=user.bank_account_holder,
    )


async def update_profile(
    db: AsyncSession,
    user: User,
    payload: UserProfileUpdate,
    key: str | None,
) -> UserProfilePublic:
    fields = payload.model_dump(exclude_unset=True)

    for field, value in fields.items():
        if field == "bank_account_number":
            if value is not None:
                user.bank_account_number = encrypt_bank(value, key or "")
            else:
                user.bank_account_number = None
        else:
            setattr(user, field, value)

    await db.flush()
    return await get_profile(db, user, key)
