from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.home_update.models import HomeUpdate, HomeUpdateStatus
from app.domains.home_update.schemas import HomeUpdateCreate, HomeUpdateUpdate
from app.domains.team.models import Team


async def create(
    db: AsyncSession,
    team_id: UUID,
    payload: HomeUpdateCreate,
    *,
    author_user_id: UUID,
) -> HomeUpdate:
    update = HomeUpdate(
        team_id=team_id,
        author_user_id=author_user_id,
        title=payload.title,
        content=payload.content,
    )
    db.add(update)
    await db.commit()
    await db.refresh(update)
    return update


async def list_team_updates(
    db: AsyncSession,
    team_id: UUID,
    *,
    include_drafts: bool,
) -> list[HomeUpdate]:
    stmt = select(HomeUpdate).where(HomeUpdate.team_id == team_id)
    if not include_drafts:
        stmt = stmt.where(HomeUpdate.status == HomeUpdateStatus.PUBLISHED)
    stmt = stmt.order_by(HomeUpdate.published_at.desc())
    return list((await db.execute(stmt)).scalars())


async def get(db: AsyncSession, update_id: UUID) -> HomeUpdate | None:
    return (
        await db.execute(select(HomeUpdate).where(HomeUpdate.id == update_id))
    ).scalar_one_or_none()


async def update(
    db: AsyncSession,
    home_update: HomeUpdate,
    payload: HomeUpdateUpdate,
) -> HomeUpdate:
    fields = payload.model_dump(exclude_unset=True)
    for key, value in fields.items():
        setattr(home_update, key, value)
    await db.commit()
    await db.refresh(home_update)
    return home_update


async def publish(db: AsyncSession, home_update: HomeUpdate) -> HomeUpdate:
    home_update.status = HomeUpdateStatus.PUBLISHED
    home_update.published_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(home_update)
    return home_update


async def delete(db: AsyncSession, home_update: HomeUpdate) -> None:
    await db.delete(home_update)
    await db.commit()


async def list_public(
    db: AsyncSession,
    team_slug: str,
) -> tuple[Team, list[HomeUpdate]]:
    team = (
        await db.execute(select(Team).where(Team.slug == team_slug))
    ).scalar_one_or_none()
    if team is None:
        raise HTTPException(404, "팀을 찾을 수 없습니다.")
    updates = list(
        (
            await db.execute(
                select(HomeUpdate)
                .where(
                    HomeUpdate.team_id == team.id,
                    HomeUpdate.status == HomeUpdateStatus.PUBLISHED,
                )
                .order_by(HomeUpdate.published_at.desc())
            )
        ).scalars()
    )
    return team, updates
