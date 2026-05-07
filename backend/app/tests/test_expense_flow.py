"""
Integration tests for the expense lifecycle through the HTTP API.

Each test function receives a ``setup`` fixture that creates a fresh
org / outreach / team / admin / member so tests are fully isolated.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.member.models import TeamRole
from app.domains.org.models import OrgRole
from app.domains.team.models import Team
from app.domains.user.models import User
from app.tests.conftest import auth_headers
from app.tests.factories import (
    make_expense,
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
class ExpenseSetup:
    team: Team
    admin: User
    member: User


@pytest_asyncio.fixture
async def setup(db: AsyncSession) -> ExpenseSetup:
    org = await make_org(db)
    outreach = await make_outreach(db, org)
    team = await make_team(db, outreach)

    admin = await make_user(db, name="Admin User")
    await make_membership(db, admin, org, role=OrgRole.ADMIN)
    await make_team_member(db, team, admin, role=TeamRole.LEADER)

    member = await make_user(db, name="Regular Member")
    await make_membership(db, member, org, role=OrgRole.MEMBER)
    await make_team_member(db, team, member, role=TeamRole.MEMBER)

    return ExpenseSetup(team=team, admin=admin, member=member)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_EXPENSE_PAYLOAD = {
    "amount": "15000.00",
    "currency": "KRW",
    "spent_at": datetime.now(UTC).isoformat(),
    "category": "MISC",
    "description": "Test purchase",
}


def _team_expenses_url(team_id: object) -> str:
    return f"/api/v1/teams/{team_id}/expenses"


def _expense_url(expense_id: object) -> str:
    return f"/api/v1/expenses/{expense_id}"


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


async def test_create_expense(
    client: AsyncClient, setup: ExpenseSetup, db: AsyncSession
) -> None:
    """POST /api/v1/teams/{teamId}/expenses → 201, data has id + status=pending."""
    resp = await client.post(
        _team_expenses_url(setup.team.id),
        json=_EXPENSE_PAYLOAD,
        headers=auth_headers(setup.member),
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert "id" in data
    assert data["status"] == "pending"
    assert data["description"] == "Test purchase"


async def test_approve_expense(
    client: AsyncClient, setup: ExpenseSetup, db: AsyncSession
) -> None:
    """Admin POSTs approve → status becomes approved."""
    expense = await make_expense(db, setup.team, setup.member)

    resp = await client.post(
        f"{_expense_url(expense.id)}/approve",
        headers=auth_headers(setup.admin),
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["status"] == "approved"
    assert data["approved_by_user_id"] == str(setup.admin.id)


async def test_reject_expense(
    client: AsyncClient, setup: ExpenseSetup, db: AsyncSession
) -> None:
    """Admin POSTs reject with reason → status=rejected, has rejection_reason."""
    expense = await make_expense(db, setup.team, setup.member)

    resp = await client.post(
        f"{_expense_url(expense.id)}/reject",
        json={"reason": "영수증 없음"},
        headers=auth_headers(setup.admin),
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["status"] == "rejected"
    assert data["rejection_reason"] == "영수증 없음"


async def test_resubmit_rejected_expense(
    client: AsyncClient, setup: ExpenseSetup, db: AsyncSession
) -> None:
    """Member PATCHes a rejected expense → status flips back to pending."""
    from app.domains.expense.models import ExpenseStatus

    expense = await make_expense(
        db, setup.team, setup.member, status=ExpenseStatus.REJECTED
    )
    # Manually set rejection_reason so the model is consistent.
    expense.rejection_reason = "Wrong amount"
    await db.flush()

    resp = await client.patch(
        _expense_url(expense.id),
        json={"description": "Corrected purchase"},
        headers=auth_headers(setup.member),
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["status"] == "pending"


async def test_member_cannot_approve(
    client: AsyncClient, setup: ExpenseSetup, db: AsyncSession
) -> None:
    """Regular member gets 403 when trying to approve an expense."""
    expense = await make_expense(db, setup.team, setup.member)

    resp = await client.post(
        f"{_expense_url(expense.id)}/approve",
        headers=auth_headers(setup.member),
    )
    assert resp.status_code == 403, resp.text


async def test_bulk_approve(
    client: AsyncClient, setup: ExpenseSetup, db: AsyncSession
) -> None:
    """POST bulk-approve → all targeted pending expenses are approved."""
    e1 = await make_expense(db, setup.team, setup.member, description="Item 1")
    e2 = await make_expense(db, setup.team, setup.member, description="Item 2")

    resp = await client.post(
        f"{_team_expenses_url(setup.team.id)}/bulk-approve",
        json={"expense_ids": [str(e1.id), str(e2.id)]},
        headers=auth_headers(setup.admin),
    )
    assert resp.status_code == 200, resp.text
    results = resp.json()["data"]
    assert len(results) == 2
    assert all(r["status"] == "approved" for r in results)
