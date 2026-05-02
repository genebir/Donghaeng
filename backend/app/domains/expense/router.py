from datetime import datetime
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import Response

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
from app.domains.expense.reports import build_expense_xlsx
from app.domains.expense.schemas import (
    ExpenseBulkApproveIn,
    ExpenseCreate,
    ExpensePublic,
    ExpenseRejectIn,
    ExpenseUpdate,
)
from app.domains.notification import service as notif_service
from app.domains.notification.models import NotificationKind

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


@nested_router.post("/bulk-approve")
async def bulk_approve_expenses(
    payload: ExpenseBulkApproveIn,
    access: TeamAccessContext,
    db: DbSession,
) -> dict[str, Any]:
    if not access.is_admin:
        raise HTTPException(403, "회계 관리 권한이 필요합니다.")
    updated = await service.bulk_approve_expenses(
        db, access.team.id, payload.expense_ids, approver_user_id=access.user_id
    )
    for expense in updated:
        await notif_service.create_notification(
            db,
            recipient_user_id=expense.purchaser_user_id,
            team_id=expense.team_id,
            kind=NotificationKind.EXPENSE_APPROVED,
            title="지출이 승인됐어요",
            body=expense.description,
            ref_id=expense.id,
        )
    return {"data": [_to_dict(e) for e in updated]}


@nested_router.get("/reports/expenses.xlsx")
async def download_expense_report(
    access: TeamAccessContext,
    db: DbSession,
) -> Response:
    if not access.is_admin:
        raise HTTPException(403, "회계 관리 권한이 필요합니다.")
    expenses = await service.list_expenses(
        db,
        access.team.id,
        actor_user_id=access.user_id,
        is_admin=True,
    )
    xlsx_bytes = build_expense_xlsx(expenses, team_name=access.team.name)
    filename = f"{access.team.name}_지출내역.xlsx"
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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
    from sqlalchemy import select
    from app.domains.user.models import User

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
    uid_set = {e.purchaser_user_id for e in expenses}
    users_by_id: dict[UUID, User] = {}
    if uid_set:
        rows = list((await db.execute(select(User).where(User.id.in_(uid_set)))).scalars())
        users_by_id = {u.id: u for u in rows}

    result = []
    for e in expenses:
        pub = ExpensePublic.model_validate(e)
        user = users_by_id.get(e.purchaser_user_id)
        if user:
            pub.purchaser_name = user.name
        result.append(pub.model_dump(mode="json"))
    return {"data": result}


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
    expense = access.expense
    updated = await service.approve_expense(
        db, expense, approver_user_id=access.user_id
    )
    await notif_service.create_notification(
        db,
        recipient_user_id=expense.purchaser_user_id,
        team_id=expense.team_id,
        kind=NotificationKind.EXPENSE_APPROVED,
        title="지출이 승인됐어요",
        body=expense.description,
        ref_id=expense.id,
    )
    return {"data": _to_dict(updated)}


@flat_router.post("/{expense_id}/reject")
async def reject_expense(
    payload: ExpenseRejectIn, access: ExpenseAdminContext, db: DbSession
) -> dict[str, Any]:
    expense = access.expense
    updated = await service.reject_expense(
        db,
        expense,
        reason=payload.reason,
        approver_user_id=access.user_id,
    )
    await notif_service.create_notification(
        db,
        recipient_user_id=expense.purchaser_user_id,
        team_id=expense.team_id,
        kind=NotificationKind.EXPENSE_REJECTED,
        title="지출이 반려됐어요",
        body=payload.reason or expense.description,
        ref_id=expense.id,
    )
    return {"data": _to_dict(updated)}
