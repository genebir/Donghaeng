"""
Permission boundary tests.

Verifies that the permission system correctly gates access:
- Non-members cannot list expenses.
- Team members can list testimonies.
- Regular members cannot create QR tokens.
- Team leaders (admin) can create QR tokens.
"""

from __future__ import annotations

from dataclasses import dataclass

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.member.models import TeamRole
from app.domains.org.models import OrgRole
from app.domains.team.models import Team
from app.domains.user.models import User
from app.tests.conftest import auth_headers
from app.tests.factories import (
    make_membership,
    make_org,
    make_outreach,
    make_team,
    make_team_member,
    make_user,
)


# ---------------------------------------------------------------------------
# Shared setup fixture
# ---------------------------------------------------------------------------


@dataclass
class PermSetup:
    team: Team
    leader: User
    member: User
    outsider: User  # authenticated but NOT in the team / org


@pytest_asyncio.fixture
async def setup(db: AsyncSession) -> PermSetup:
    org = await make_org(db)
    outreach = await make_outreach(db, org)
    team = await make_team(db, outreach)

    leader = await make_user(db, name="Team Leader")
    await make_membership(db, leader, org, role=OrgRole.ADMIN)
    await make_team_member(db, team, leader, role=TeamRole.LEADER)

    member = await make_user(db, name="Team Member")
    await make_membership(db, member, org, role=OrgRole.MEMBER)
    await make_team_member(db, team, member, role=TeamRole.MEMBER)

    outsider = await make_user(db, name="Outsider")
    # No org membership, no team membership for outsider.

    return PermSetup(team=team, leader=leader, member=member, outsider=outsider)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


async def test_non_member_cannot_list_expenses(
    client: AsyncClient, setup: PermSetup
) -> None:
    """A user who is not part of the team gets 403 (or 404) when listing expenses."""
    resp = await client.get(
        f"/api/v1/teams/{setup.team.id}/expenses",
        headers=auth_headers(setup.outsider),
    )
    assert resp.status_code in {403, 404}, resp.text


async def test_member_can_list_testimonies(
    client: AsyncClient, setup: PermSetup
) -> None:
    """A regular team member can GET the team's testimony list (200)."""
    resp = await client.get(
        f"/api/v1/teams/{setup.team.id}/testimonies",
        headers=auth_headers(setup.member),
    )
    assert resp.status_code == 200, resp.text
    assert "data" in resp.json()


async def test_non_admin_cannot_create_qr_token(
    client: AsyncClient, setup: PermSetup
) -> None:
    """A regular MEMBER gets 403 when trying to create a QR token."""
    resp = await client.post(
        f"/api/v1/teams/{setup.team.id}/testimonies/qr-tokens",
        json={"label": "Sunday service"},
        headers=auth_headers(setup.member),
    )
    assert resp.status_code == 403, resp.text


async def test_admin_can_create_qr_token(
    client: AsyncClient, setup: PermSetup
) -> None:
    """Team LEADER gets 201 when creating a QR token."""
    resp = await client.post(
        f"/api/v1/teams/{setup.team.id}/testimonies/qr-tokens",
        json={"label": "Sunday service"},
        headers=auth_headers(setup.leader),
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert "token" in data
    assert data["is_active"] is True
