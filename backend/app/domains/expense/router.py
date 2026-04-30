from datetime import datetime
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Query, status

from app.core.permissions import (
    ExpenseAccessContext,
    ExpenseAdminContext,
    TeamAccessContext,
)
from app.deps import DbSession
from app.domains.expense import service
from app.domains.expense.models import (
    ExpenseCategory,
    ExpenseStatus,
    PaymentMethod,
)
from app.domains.expense.schemas import (
    ExpenseCreate,
    ExpensePublic,
    ExpenseRejectIn,
    ExpenseUpdate,
)

# /api/v1/teams/{team_id}/expenses
nested_router = APIRouter(prefix="/teams/{team_id}/expenses", tags=["expense"])

# /api/v1/expenses/{expense_id}
flat_router = APIRouter(prefix="/expenses", tags=["expense"])


def _to_dict(expense: Any) -> dict[str, Any]:
    return ExpensePublic.model_validate(expense).model_dump(mode="json")


@nested_router.post("", status_code=status.HTTP_201_CREATED)
async def create_expense(
    payload: ExpenseCreate, access: TeamAccessContext, db: DbSession
) -> dict[str, Any]:
    expense = await service.create_expense(
        db,
        access.team.id,
        payload,
        actor_user_id=access.user_id,
        is_admin=access.is_admin,
    )
    return {"data": _to_dict(expense)}


@nested_router.get("")
async def list_expenses(
    access: TeamAccessContext,
    db: DbSession,
    status_filter: Annotated[
        ExpenseStatus | None, Query(alias="status")
    ] = None,
    category: Annotated[ExpenseCategory | None, Query()] = None,
    purchaser_user_id: Annotated[UUID | None, Query()] = None,
    payment_method: Annotated[PaymentMethod | None, Query()] = None,
    spent_from: Annotated[datetime | None, Query(alias="from")] = None,
    spent_to: Annotated[datetime | None, Query(alias="to")] = None,
) -> dict[str, Any]:
    expenses = await service.list_expenses(
        db,
        access.team.id,
        actor_user_id=access.user_id,
        is_admin=access.is_admin,
        status_filter=status_filter,
        category=category,
        purchaser_user_id=purchaser_user_id,
        payment_method=payment_method,
        spent_from=spent_from,
        spent_to=spent_to,
    )
    return {"data": [_to_dict(e) for e in expenses]}


@flat_router.get("/{expense_id}")
async def get_expense(access: ExpenseAccessContext) -> dict[str, Any]:
    return {"data": _to_dict(access.expense)}


@flat_router.patch("/{expense_id}")
async def update_expense(
    payload: ExpenseUpdate,
    access: ExpenseAccessContext,
    db: DbSession,
) -> dict[str, Any]:
    updated = await service.update_expense(
        db,
        access.expense,
        payload,
        is_admin=access.is_admin,
        is_self=access.is_self,
    )
    return {"data": _to_dict(updated)}


@flat_router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    access: ExpenseAccessContext, db: DbSession
) -> None:
    await service.delete_expense(
        db,
        access.expense,
        is_admin=access.is_admin,
        is_self=access.is_self,
    )


@flat_router.post("/{expense_id}/approve")
async def approve_expense(
    access: ExpenseAdminContext, db: DbSession
) -> dict[str, Any]:
    updated = await service.approve_expense(
        db, access.expense, approver_user_id=access.user_id
    )
    return {"data": _to_dict(updated)}


@flat_router.post("/{expense_id}/reject")
async def reject_expense(
    payload: ExpenseRejectIn, access: ExpenseAdminContext, db: DbSession
) -> dict[str, Any]:
    updated = await service.reject_expense(
        db,
        access.expense,
        reason=payload.reason,
        approver_user_id=access.user_id,
    )
    return {"data": _to_dict(updated)}
