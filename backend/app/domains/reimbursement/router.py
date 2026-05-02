from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Path, status

from app.core.permissions import (
    TeamAccessContext,
    _check_team_admin,
    _resolve_team_membership,
)
from app.deps import CurrentUser, DbSession
from app.domains.reimbursement import service
from app.domains.reimbursement.models import Reimbursement, ReimbursementStatus
from app.domains.reimbursement.schemas import (
    ReimbursementComplete,
    ReimbursementCreate,
    ReimbursementPublic,
)
from app.domains.notification import service as notif_service
from app.domains.notification.models import NotificationKind

# /api/v1/teams/{team_id}/reimbursements
nested_router = APIRouter(
    prefix="/teams/{team_id}/reimbursements", tags=["reimbursement"]
)

# /api/v1/reimbursements/{reimbursement_id}
flat_router = APIRouter(prefix="/reimbursements", tags=["reimbursement"])


def _to_dict(pub: ReimbursementPublic) -> dict[str, Any]:
    return pub.model_dump(mode="json")


async def _require_admin_for_reimbursement(
    db: DbSession,
    user: CurrentUser,
    reimbursement_id: UUID,
) -> tuple[Reimbursement, None]:
    """Fetch reimbursement and verify the current user is a team admin."""
    from app.domains.reimbursement.service import _require_reimbursement

    obj = await _require_reimbursement(db, reimbursement_id)
    team, org_membership = await _resolve_team_membership(db, user, obj.team_id)
    is_admin = await _check_team_admin(db, user.id, team, org_membership)
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="회계 관리 권한이 필요합니다.",
        )
    return obj, None


# ---------------------------------------------------------------------------
# Nested routes — /teams/{team_id}/reimbursements
# ---------------------------------------------------------------------------


@nested_router.post("/preview")
async def preview_reimbursements(
    access: TeamAccessContext,
    db: DbSession,
) -> dict[str, Any]:
    if not access.is_admin:
        raise HTTPException(403, "회계 관리 권한이 필요합니다.")
    data = await service.preview(db, access.team.id)
    return {"data": data}


@nested_router.post("", status_code=status.HTTP_201_CREATED)
async def create_reimbursement(
    payload: ReimbursementCreate,
    access: TeamAccessContext,
    db: DbSession,
) -> dict[str, Any]:
    if not access.is_admin:
        raise HTTPException(403, "회계 관리 권한이 필요합니다.")
    reimbursement, expenses = await service.create(
        db, access.team.id, payload, actor_user_id=access.user_id
    )
    pub = ReimbursementPublic.model_validate(reimbursement)
    from app.domains.expense.schemas import ExpensePublic

    pub.expenses = [ExpensePublic.model_validate(e) for e in expenses]
    return {"data": _to_dict(pub)}


@nested_router.get("/mine")
async def get_my_reimbursement_summary(
    access: TeamAccessContext,
    db: DbSession,
) -> dict[str, Any]:
    data = await service.get_my_summary(db, access.team.id, access.user_id)
    return {"data": data}


@nested_router.get("")
async def list_reimbursements(
    access: TeamAccessContext,
    db: DbSession,
    status_filter: Annotated[ReimbursementStatus | None, None] = None,
    recipient_user_id: Annotated[UUID | None, None] = None,
) -> dict[str, Any]:
    if not access.is_admin:
        raise HTTPException(403, "회계 관리 권한이 필요합니다.")
    items = await service.list_reimbursements(
        db,
        access.team.id,
        status_filter=status_filter,
        recipient_user_id=recipient_user_id,
    )
    # Batch-fetch recipient names
    from sqlalchemy import select
    from app.domains.user.models import User

    uid_set = {r.recipient_user_id for r in items}
    users_by_id: dict[UUID, User] = {}
    if uid_set:
        rows = list((await db.execute(select(User).where(User.id.in_(uid_set)))).scalars())
        users_by_id = {u.id: u for u in rows}

    result = []
    for r in items:
        pub = ReimbursementPublic.model_validate(r)
        user = users_by_id.get(r.recipient_user_id)
        if user:
            pub.recipient_name = user.name
        result.append(pub.model_dump(mode="json"))
    return {"data": result}


# ---------------------------------------------------------------------------
# Flat routes — /reimbursements/{reimbursement_id}
# ---------------------------------------------------------------------------


@flat_router.get("/{reimbursement_id}")
async def get_reimbursement(
    reimbursement_id: Annotated[UUID, Path()],
    db: DbSession,
    user: CurrentUser,
) -> dict[str, Any]:
    obj, _ = await _require_admin_for_reimbursement(db, user, reimbursement_id)
    pub = await service.get(db, obj.id)
    return {"data": _to_dict(pub)}


@flat_router.post("/{reimbursement_id}/confirm")
async def confirm_reimbursement(
    reimbursement_id: Annotated[UUID, Path()],
    db: DbSession,
    user: CurrentUser,
) -> dict[str, Any]:
    obj, _ = await _require_admin_for_reimbursement(db, user, reimbursement_id)
    updated = await service.confirm(db, obj)
    await notif_service.create_notification(
        db,
        recipient_user_id=obj.recipient_user_id,
        team_id=obj.team_id,
        kind=NotificationKind.REIMBURSEMENT_CONFIRMED,
        title="정산이 확정됐어요",
        body="곧 송금될 예정이에요.",
        ref_id=obj.id,
    )
    pub = ReimbursementPublic.model_validate(updated)
    return {"data": _to_dict(pub)}


@flat_router.post("/{reimbursement_id}/complete")
async def complete_reimbursement(
    reimbursement_id: Annotated[UUID, Path()],
    payload: ReimbursementComplete,
    db: DbSession,
    user: CurrentUser,
) -> dict[str, Any]:
    obj, _ = await _require_admin_for_reimbursement(db, user, reimbursement_id)
    updated = await service.complete(db, obj, payload)
    await notif_service.create_notification(
        db,
        recipient_user_id=obj.recipient_user_id,
        team_id=obj.team_id,
        kind=NotificationKind.REIMBURSEMENT_COMPLETED,
        title="정산 송금이 완료됐어요",
        body=f"{payload.transfer_method} · {payload.transfer_reference}" if payload.transfer_reference else None,
        ref_id=obj.id,
    )
    pub = ReimbursementPublic.model_validate(updated)
    return {"data": _to_dict(pub)}


@flat_router.post("/{reimbursement_id}/reopen")
async def reopen_reimbursement(
    reimbursement_id: Annotated[UUID, Path()],
    db: DbSession,
    user: CurrentUser,
) -> dict[str, Any]:
    obj, _ = await _require_admin_for_reimbursement(db, user, reimbursement_id)
    updated = await service.reopen(db, obj)
    pub = ReimbursementPublic.model_validate(updated)
    return {"data": _to_dict(pub)}
