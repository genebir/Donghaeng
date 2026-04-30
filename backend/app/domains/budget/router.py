from typing import Any

from fastapi import APIRouter

from app.core.permissions import TeamAdminContext, TeamContext
from app.deps import DbSession
from app.domains.budget import service
from app.domains.budget.schemas import BudgetSummary, BudgetUpsert

# /api/v1/teams/{team_id}/budget
router = APIRouter(prefix="/teams/{team_id}/budget", tags=["budget"])


@router.get("")
async def get_budget(
    team: TeamContext, db: DbSession
) -> dict[str, Any]:
    summary: BudgetSummary = await service.summary(db, team.id)
    return summary.model_dump(mode="json")


@router.put("")
async def put_budget(
    payload: BudgetUpsert, team: TeamAdminContext, db: DbSession
) -> dict[str, Any]:
    await service.upsert_entries(db, team.id, payload)
    summary = await service.summary(db, team.id)
    return summary.model_dump(mode="json")
