from collections.abc import Sequence
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.team.models import Destination, Team
from app.domains.team.schemas import (
    DestinationUpsert,
    TeamCreate,
    TeamUpdate,
)


async def create_team(
    db: AsyncSession, outreach_id: UUID, payload: TeamCreate
) -> Team:
    existing = await db.execute(
        select(Team).where(
            Team.outreach_id == outreach_id, Team.slug == payload.slug
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"같은 아웃리치 안에 slug '{payload.slug}'가 이미 있습니다.",
        )

    team = Team(
        outreach_id=outreach_id,
        name=payload.name,
        slug=payload.slug,
        starts_on=payload.starts_on,
        ends_on=payload.ends_on,
        description=payload.description,
    )
    db.add(team)
    await db.commit()
    await db.refresh(team)
    return team


async def list_teams_in_outreach(
    db: AsyncSession, outreach_id: UUID
) -> Sequence[Team]:
    stmt = (
        select(Team)
        .where(Team.outreach_id == outreach_id)
        .order_by(Team.created_at.asc())
    )
    return list((await db.execute(stmt)).scalars())


async def get_team(db: AsyncSession, team_id: UUID) -> Team:
    team = (
        await db.execute(select(Team).where(Team.id == team_id))
    ).scalar_one_or_none()
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="팀을 찾을 수 없습니다.",
        )
    return team


async def update_team(
    db: AsyncSession, team_id: UUID, payload: TeamUpdate
) -> Team:
    team = await get_team(db, team_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(team, key, value)
    await db.commit()
    await db.refresh(team)
    return team


async def get_destination(
    db: AsyncSession, team_id: UUID
) -> Destination | None:
    return (
        await db.execute(select(Destination).where(Destination.team_id == team_id))
    ).scalar_one_or_none()


async def upsert_destination(
    db: AsyncSession, team_id: UUID, payload: DestinationUpsert
) -> Destination:
    """
    팀 destination upsert — 미제공 필드는 기존 값/서버 기본값 유지 (PATCH 의미).
    - INSERT: 미제공 필드는 SQLAlchemy server_default(있으면) 또는 None.
    - UPDATE: 미제공 필드는 기존 값 보존.
    """
    destination = await get_destination(db, team_id)
    provided = payload.model_dump(exclude_unset=True)
    if destination is None:
        # church_name은 schema에서 required라 항상 provided에 포함됨.
        destination = Destination(team_id=team_id, **provided)
        db.add(destination)
    else:
        for key, value in provided.items():
            setattr(destination, key, value)
    await db.commit()
    await db.refresh(destination)
    return destination
