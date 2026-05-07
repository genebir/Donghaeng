"""
Async factory helpers for test data.

All functions call ``db.flush()`` (not ``db.commit()``) so the
per-test savepoint mechanism in conftest keeps everything inside a
single rollback-able transaction.
"""

from __future__ import annotations

import secrets
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.expense.models import (
    Expense,
    ExpenseCategory,
    ExpenseStatus,
)
from app.domains.member.models import TeamMember, TeamPart, TeamRole
from app.domains.org.models import OrgMembership, OrgRole, Organization
from app.domains.outreach.models import Outreach
from app.domains.team.models import Team, TeamStatus
from app.domains.testimony.models import QrToken
from app.domains.user.models import User


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------


async def make_user(
    db: AsyncSession,
    *,
    name: str = "Test User",
    email: str | None = None,
    oauth_provider: str | None = None,
    oauth_subject: str | None = None,
) -> User:
    """Create and flush a User.  Email is unique per call by default."""
    if email is None:
        email = f"user-{uuid4().hex[:8]}@example.com"
    user = User(
        email=email,
        name=name,
        oauth_provider=oauth_provider,
        oauth_subject=oauth_subject,
    )
    db.add(user)
    await db.flush()
    return user


# ---------------------------------------------------------------------------
# Organization
# ---------------------------------------------------------------------------


async def make_org(
    db: AsyncSession,
    *,
    name: str = "Test Org",
    slug: str | None = None,
) -> Organization:
    """Create and flush an Organization."""
    if slug is None:
        slug = f"org-{uuid4().hex[:8]}"
    org = Organization(name=name, slug=slug)
    db.add(org)
    await db.flush()
    return org


# ---------------------------------------------------------------------------
# OrgMembership
# ---------------------------------------------------------------------------


async def make_membership(
    db: AsyncSession,
    user: User,
    org: Organization,
    role: OrgRole = OrgRole.MEMBER,
) -> OrgMembership:
    """Create and flush an OrgMembership."""
    membership = OrgMembership(
        organization_id=org.id,
        user_id=user.id,
        role=role,
    )
    db.add(membership)
    await db.flush()
    return membership


# ---------------------------------------------------------------------------
# Outreach
# ---------------------------------------------------------------------------


async def make_outreach(
    db: AsyncSession,
    org: Organization,
    *,
    name: str = "Test Outreach",
    year: int = 2026,
) -> Outreach:
    """Create and flush an Outreach."""
    outreach = Outreach(
        organization_id=org.id,
        name=name,
        year=year,
    )
    db.add(outreach)
    await db.flush()
    return outreach


# ---------------------------------------------------------------------------
# Team
# ---------------------------------------------------------------------------


async def make_team(
    db: AsyncSession,
    outreach: Outreach,
    *,
    name: str = "Test Team",
    slug: str | None = None,
    status: TeamStatus = TeamStatus.PLANNING,
) -> Team:
    """Create and flush a Team."""
    if slug is None:
        slug = f"team-{uuid4().hex[:8]}"
    team = Team(
        outreach_id=outreach.id,
        name=name,
        slug=slug,
        status=status,
    )
    db.add(team)
    await db.flush()
    return team


# ---------------------------------------------------------------------------
# TeamMember
# ---------------------------------------------------------------------------


async def make_team_member(
    db: AsyncSession,
    team: Team,
    user: User,
    *,
    role: TeamRole = TeamRole.MEMBER,
    part: TeamPart | None = None,
) -> TeamMember:
    """Create and flush a TeamMember."""
    tm = TeamMember(
        team_id=team.id,
        user_id=user.id,
        role=role,
        part=part,
    )
    db.add(tm)
    await db.flush()
    return tm


# ---------------------------------------------------------------------------
# Expense
# ---------------------------------------------------------------------------


async def make_expense(
    db: AsyncSession,
    team: Team,
    user: User,
    *,
    amount: Decimal = Decimal("10000.00"),
    description: str = "Test expense",
    category: ExpenseCategory = ExpenseCategory.MISC,
    status: ExpenseStatus = ExpenseStatus.PENDING,
    spent_at: datetime | None = None,
) -> Expense:
    """Create and flush an Expense."""
    if spent_at is None:
        spent_at = datetime.now(UTC)
    expense = Expense(
        team_id=team.id,
        purchaser_user_id=user.id,
        amount=amount,
        currency="KRW",
        spent_at=spent_at,
        category=category,
        description=description,
        status=status,
    )
    db.add(expense)
    await db.flush()
    return expense


# ---------------------------------------------------------------------------
# QrToken
# ---------------------------------------------------------------------------


async def make_qr_token(
    db: AsyncSession,
    team: Team,
    *,
    label: str | None = None,
    is_active: bool = True,
) -> QrToken:
    """Create and flush a QrToken with a random URL-safe token value."""
    qr_token = QrToken(
        team_id=team.id,
        token=secrets.token_urlsafe(16),
        label=label,
        is_active=is_active,
    )
    db.add(qr_token)
    await db.flush()
    return qr_token
