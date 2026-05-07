"""
QR token + anonymous testimony tests.

Tests the public ``/api/v1/qr/{token}`` endpoints that require no auth,
as well as edge cases for invalid / deactivated tokens.
"""

from __future__ import annotations

from dataclasses import dataclass

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.member.models import TeamRole
from app.domains.org.models import OrgRole
from app.domains.team.models import Team
from app.domains.testimony.models import QrToken
from app.tests.factories import (
    make_membership,
    make_org,
    make_outreach,
    make_qr_token,
    make_team,
    make_team_member,
    make_user,
)


# ---------------------------------------------------------------------------
# Shared setup fixture
# ---------------------------------------------------------------------------


@dataclass
class QrSetup:
    team: Team
    active_qr: QrToken
    inactive_qr: QrToken


@pytest_asyncio.fixture
async def setup(db: AsyncSession) -> QrSetup:
    org = await make_org(db)
    outreach = await make_outreach(db, org)
    team = await make_team(db, outreach)

    leader = await make_user(db, name="Team Leader")
    await make_membership(db, leader, org, role=OrgRole.ADMIN)
    await make_team_member(db, team, leader, role=TeamRole.LEADER)

    active_qr = await make_qr_token(db, team, label="Active token", is_active=True)
    inactive_qr = await make_qr_token(db, team, label="Inactive token", is_active=False)

    return QrSetup(team=team, active_qr=active_qr, inactive_qr=inactive_qr)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


async def test_get_qr_info(client: AsyncClient, setup: QrSetup) -> None:
    """GET /api/v1/qr/{token} returns team info for a valid, active token."""
    resp = await client.get(f"/api/v1/qr/{setup.active_qr.token}")
    assert resp.status_code == 200, resp.text
    body = resp.json()["data"]
    assert body["team"]["id"] == str(setup.team.id)
    assert body["team"]["name"] == setup.team.name
    assert body["token"]["token"] == setup.active_qr.token


async def test_submit_anonymous_testimony(
    client: AsyncClient, setup: QrSetup, db: AsyncSession
) -> None:
    """POST /api/v1/qr/{token}/submit creates an anonymous testimony (201)."""
    resp = await client.post(
        f"/api/v1/qr/{setup.active_qr.token}/submit",
        json={
            "kind": "testimony",
            "content": "하나님께서 역사하셨어요.",
            "submitted_name": "홍길동",
        },
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert "id" in data


async def test_invalid_token_returns_404(
    client: AsyncClient, setup: QrSetup
) -> None:
    """A completely unknown token string returns 404."""
    resp = await client.get("/api/v1/qr/this-token-does-not-exist-at-all")
    assert resp.status_code == 404, resp.text


async def test_deactivated_token_returns_404(
    client: AsyncClient, setup: QrSetup
) -> None:
    """An inactive (deactivated) token returns 404 on GET."""
    resp = await client.get(f"/api/v1/qr/{setup.inactive_qr.token}")
    assert resp.status_code == 404, resp.text
