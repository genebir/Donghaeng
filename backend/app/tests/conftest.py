"""
Test harness for Donghaeng FastAPI backend.

Strategy
--------
* A separate test DB (donghaeng_test) is used.
* Tables are created once per session and dropped at the end.
* Each test gets a connection-level transaction with a savepoint
  so that any service-layer commit() calls only flush to the
  savepoint, and everything is rolled back when the test finishes.
* The FastAPI ``get_db`` dependency is overridden to yield the
  per-test session, so the HTTP client shares the same transaction.
"""

from __future__ import annotations

import os
from collections.abc import AsyncIterator
from typing import TYPE_CHECKING

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncConnection,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.security import issue_access_token
from app.db.session import get_db

# Import all models so their tables are registered on Base.metadata
# before create_all is called.
import app.domains.budget.models  # noqa: F401
import app.domains.checklist.models  # noqa: F401
import app.domains.expense.models  # noqa: F401
import app.domains.home_update.models  # noqa: F401
import app.domains.media.models  # noqa: F401
import app.domains.member.models  # noqa: F401
import app.domains.notification.models  # noqa: F401
import app.domains.org.models  # noqa: F401
import app.domains.outreach.models  # noqa: F401
import app.domains.reimbursement.models  # noqa: F401
import app.domains.schedule.models  # noqa: F401
import app.domains.team.models  # noqa: F401
import app.domains.testimony.models  # noqa: F401
import app.domains.user.models  # noqa: F401

from app.db.base import Base
from app.main import create_app

if TYPE_CHECKING:
    from app.domains.user.models import User

# ---------------------------------------------------------------------------
# Test database engine
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://donghaeng:donghaeng@localhost:5433/donghaeng_test",
)

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
)

test_session_maker = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ---------------------------------------------------------------------------
# Session-scoped: create / drop tables once per test run
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables() -> AsyncIterator[None]:
    """Create all tables before the test session; drop them at the end."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


# ---------------------------------------------------------------------------
# Per-test: transaction + savepoint rollback
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def db() -> AsyncIterator[AsyncSession]:
    """
    Yields an AsyncSession that wraps a connection-level transaction.

    All ``session.commit()`` calls inside services are demoted to
    savepoints (via ``join_transaction_mode="create_savepoint"``),
    so the outer transaction can be rolled back after each test,
    leaving the DB clean.
    """
    async with test_engine.connect() as conn:
        await conn.begin()
        session = AsyncSession(
            bind=conn,
            join_transaction_mode="create_savepoint",
            expire_on_commit=False,
        )
        try:
            yield session
        finally:
            await session.close()
            await conn.rollback()


# ---------------------------------------------------------------------------
# Per-test: HTTP client with overridden get_db
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def client(db: AsyncSession) -> AsyncIterator[AsyncClient]:
    """
    AsyncClient using ASGITransport with ``get_db`` overridden to share
    the per-test transactional session.
    """

    async def _override_get_db() -> AsyncIterator[AsyncSession]:
        yield db

    app = create_app()
    app.dependency_overrides[get_db] = _override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helper: build auth headers from a User instance
# ---------------------------------------------------------------------------


def auth_headers(user: "User") -> dict[str, str]:
    """Return Authorization headers for the given user."""
    token, _ = issue_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}
