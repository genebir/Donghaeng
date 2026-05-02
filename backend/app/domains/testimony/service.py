import secrets
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.testimony.models import (
    QrToken,
    Testimony,
    TestimonyKind,
    TestimonyVisibility,
)
from app.domains.testimony.schemas import (
    AnonymousTestimonyCreate,
    TestimonyCreate,
    TestimonyUpdate,
)


# ---------------------------------------------------------------------------
# QrToken
# ---------------------------------------------------------------------------

async def create_qr_token(
    db: AsyncSession,
    team_id: UUID,
    label: str | None = None,
) -> QrToken:
    token_value = secrets.token_urlsafe(48)[:64]
    qr_token = QrToken(
        team_id=team_id,
        token=token_value,
        label=label,
    )
    db.add(qr_token)
    await db.commit()
    await db.refresh(qr_token)
    return qr_token


async def list_qr_tokens(
    db: AsyncSession,
    team_id: UUID,
) -> list[QrToken]:
    stmt = (
        select(QrToken)
        .where(QrToken.team_id == team_id)
        .order_by(QrToken.created_at.desc())
    )
    return list((await db.execute(stmt)).scalars())


async def deactivate_qr_token(
    db: AsyncSession,
    token_id: UUID,
    team_id: UUID,
) -> None:
    qr_token = (
        await db.execute(
            select(QrToken).where(
                QrToken.id == token_id,
                QrToken.team_id == team_id,
            )
        )
    ).scalar_one_or_none()
    if qr_token is not None:
        qr_token.is_active = False
        await db.commit()


async def get_qr_token_by_token(
    db: AsyncSession,
    token: str,
) -> QrToken | None:
    return (
        await db.execute(select(QrToken).where(QrToken.token == token))
    ).scalar_one_or_none()


# ---------------------------------------------------------------------------
# Testimony
# ---------------------------------------------------------------------------

async def create_testimony(
    db: AsyncSession,
    team_id: UUID,
    payload: TestimonyCreate,
    *,
    author_user_id: UUID,
) -> Testimony:
    testimony = Testimony(
        team_id=team_id,
        submitter_user_id=author_user_id,
        kind=payload.kind,
        visibility=payload.visibility,
        content=payload.content,
        submitted_name=payload.submitted_name,
    )
    db.add(testimony)
    await db.commit()
    await db.refresh(testimony)
    return testimony


async def create_anonymous_testimony(
    db: AsyncSession,
    team_id: UUID,
    qr_token_id: UUID | None,
    payload: AnonymousTestimonyCreate,
) -> Testimony:
    testimony = Testimony(
        team_id=team_id,
        qr_token_id=qr_token_id,
        submitter_user_id=None,
        kind=payload.kind,
        visibility=TestimonyVisibility.ANONYMOUS,
        content=payload.content,
        submitted_name=payload.submitted_name,
    )
    db.add(testimony)
    await db.commit()
    await db.refresh(testimony)
    return testimony


async def list_testimonies(
    db: AsyncSession,
    team_id: UUID,
    *,
    kind: TestimonyKind | None = None,
    visibility: TestimonyVisibility | None = None,
) -> list[Testimony]:
    stmt = (
        select(Testimony)
        .where(Testimony.team_id == team_id)
        .order_by(Testimony.created_at.desc())
    )
    if kind is not None:
        stmt = stmt.where(Testimony.kind == kind)
    if visibility is not None:
        stmt = stmt.where(Testimony.visibility == visibility)
    return list((await db.execute(stmt)).scalars())


async def list_public_testimonies(
    db: AsyncSession,
    team_id: UUID,
) -> list[Testimony]:
    stmt = (
        select(Testimony)
        .where(
            Testimony.team_id == team_id,
            Testimony.visibility.in_(
                [TestimonyVisibility.PUBLIC, TestimonyVisibility.ANONYMOUS]
            ),
        )
        .order_by(Testimony.is_featured.desc(), Testimony.created_at.desc())
    )
    return list((await db.execute(stmt)).scalars())


async def update_testimony(
    db: AsyncSession,
    testimony: Testimony,
    payload: TestimonyUpdate,
) -> Testimony:
    fields = payload.model_dump(exclude_unset=True)
    for key, value in fields.items():
        setattr(testimony, key, value)
    await db.commit()
    await db.refresh(testimony)
    return testimony


async def delete_testimony(
    db: AsyncSession,
    testimony: Testimony,
) -> None:
    await db.delete(testimony)
    await db.commit()
