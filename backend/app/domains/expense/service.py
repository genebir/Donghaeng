from collections.abc import Sequence
from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.checklist.models import ChecklistItem
from app.domains.expense.models import (
    Expense,
    ExpenseCategory,
    ExpenseStatus,
    PaymentMethod,
)
from app.domains.expense.schemas import ExpenseCreate, ExpenseUpdate
from app.domains.member.models import TeamMember


async def _validate_purchaser_in_team(
    db: AsyncSession, team_id: UUID, purchaser_user_id: UUID
) -> None:
    """결제자가 이 팀의 멤버인지 확인 (admin이 대신 등록할 때 검증)."""
    member = (
        await db.execute(
            select(TeamMember).where(
                TeamMember.team_id == team_id,
                TeamMember.user_id == purchaser_user_id,
            )
        )
    ).scalar_one_or_none()
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="purchaser_user_id가 이 팀의 멤버가 아닙니다.",
        )


async def _validate_checklist_item(
    db: AsyncSession, team_id: UUID, checklist_item_id: UUID | None
) -> None:
    if checklist_item_id is None:
        return
    item = (
        await db.execute(
            select(ChecklistItem).where(
                ChecklistItem.id == checklist_item_id,
                ChecklistItem.team_id == team_id,
            )
        )
    ).scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="checklist_item_id가 이 팀의 준비물이 아닙니다.",
        )


async def create_expense(
    db: AsyncSession,
    team_id: UUID,
    payload: ExpenseCreate,
    *,
    actor_user_id: UUID,
    is_admin: bool,
) -> Expense:
    # 본인 외 등록은 admin만. 비-admin이 보내면 무시 + 자기로 강제.
    if payload.purchaser_user_id is not None and is_admin:
        purchaser_user_id = payload.purchaser_user_id
    else:
        purchaser_user_id = actor_user_id

    if purchaser_user_id != actor_user_id:
        await _validate_purchaser_in_team(db, team_id, purchaser_user_id)

    await _validate_checklist_item(db, team_id, payload.checklist_item_id)

    expense = Expense(
        team_id=team_id,
        purchaser_user_id=purchaser_user_id,
        amount=payload.amount,
        currency=payload.currency,
        spent_at=payload.spent_at,
        vendor=payload.vendor,
        category=payload.category,
        description=payload.description,
        payment_method=payload.payment_method,
        receipt_media_id=payload.receipt_media_id,
        checklist_item_id=payload.checklist_item_id,
        ocr_raw=payload.ocr_raw,
        notes=payload.notes,
    )
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense


async def list_expenses(
    db: AsyncSession,
    team_id: UUID,
    *,
    actor_user_id: UUID,
    is_admin: bool,
    status_filter: ExpenseStatus | None = None,
    category: ExpenseCategory | None = None,
    purchaser_user_id: UUID | None = None,
    payment_method: PaymentMethod | None = None,
    spent_from: datetime | None = None,
    spent_to: datetime | None = None,
) -> Sequence[Expense]:
    stmt = (
        select(Expense)
        .where(Expense.team_id == team_id)
        .order_by(Expense.spent_at.desc(), Expense.created_at.desc())
    )
    if not is_admin:
        # 일반 팀원은 본인 것만. 다른 사람 필터를 보내도 무시.
        stmt = stmt.where(Expense.purchaser_user_id == actor_user_id)
    elif purchaser_user_id is not None:
        stmt = stmt.where(Expense.purchaser_user_id == purchaser_user_id)

    if status_filter is not None:
        stmt = stmt.where(Expense.status == status_filter)
    if category is not None:
        stmt = stmt.where(Expense.category == category)
    if payment_method is not None:
        stmt = stmt.where(Expense.payment_method == payment_method)
    if spent_from is not None:
        stmt = stmt.where(Expense.spent_at >= spent_from)
    if spent_to is not None:
        stmt = stmt.where(Expense.spent_at < spent_to)
    return list((await db.execute(stmt)).scalars())


def _ensure_mutable(expense: Expense, *, is_admin: bool, is_self: bool) -> None:
    """수정/삭제 가능 상태 가드 — DATABASE.md status flow 기준."""
    if expense.status == ExpenseStatus.REIMBURSED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 정산 완료된 지출은 변경할 수 없습니다.",
        )
    if not is_admin:
        if not is_self:
            # require_expense_access에서 이미 차단했지만 방어적으로.
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="이 지출을 변경할 권한이 없습니다.",
            )
        if expense.status not in (
            ExpenseStatus.PENDING,
            ExpenseStatus.REJECTED,
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="승인된 지출은 본인이 수정할 수 없습니다.",
            )


async def update_expense(
    db: AsyncSession,
    expense: Expense,
    payload: ExpenseUpdate,
    *,
    is_admin: bool,
    is_self: bool,
) -> Expense:
    _ensure_mutable(expense, is_admin=is_admin, is_self=is_self)
    fields = payload.model_dump(exclude_unset=True)
    if "checklist_item_id" in fields:
        await _validate_checklist_item(
            db, expense.team_id, fields["checklist_item_id"]
        )
    for key, value in fields.items():
        setattr(expense, key, value)
    await db.commit()
    await db.refresh(expense)
    return expense


async def delete_expense(
    db: AsyncSession, expense: Expense, *, is_admin: bool, is_self: bool
) -> None:
    _ensure_mutable(expense, is_admin=is_admin, is_self=is_self)
    await db.delete(expense)
    await db.commit()


async def approve_expense(
    db: AsyncSession, expense: Expense, *, approver_user_id: UUID
) -> Expense:
    if expense.status not in (ExpenseStatus.PENDING, ExpenseStatus.REJECTED):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 승인되었거나 정산된 지출입니다.",
        )
    expense.status = ExpenseStatus.APPROVED
    expense.approved_by_user_id = approver_user_id
    expense.approved_at = datetime.now(UTC)
    expense.rejection_reason = None
    await db.commit()
    await db.refresh(expense)
    return expense


async def bulk_approve_expenses(
    db: AsyncSession,
    team_id: UUID,
    expense_ids: list[UUID],
    *,
    approver_user_id: UUID,
) -> list[Expense]:
    """Approve all pending/rejected expenses in expense_ids that belong to team_id.
    Silently skip already-approved or reimbursed ones."""
    stmt = select(Expense).where(
        Expense.id.in_(expense_ids),
        Expense.team_id == team_id,
        Expense.status.in_([ExpenseStatus.PENDING, ExpenseStatus.REJECTED]),
    )
    expenses = list((await db.execute(stmt)).scalars())
    now = datetime.now(UTC)
    for e in expenses:
        e.status = ExpenseStatus.APPROVED
        e.approved_by_user_id = approver_user_id
        e.approved_at = now
        e.rejection_reason = None
    await db.commit()
    return expenses


async def reject_expense(
    db: AsyncSession,
    expense: Expense,
    *,
    reason: str,
    approver_user_id: UUID,
) -> Expense:
    if expense.status == ExpenseStatus.REIMBURSED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 정산 완료된 지출은 반려할 수 없습니다.",
        )
    expense.status = ExpenseStatus.REJECTED
    expense.approved_by_user_id = approver_user_id
    expense.approved_at = datetime.now(UTC)
    expense.rejection_reason = reason
    await db.commit()
    await db.refresh(expense)
    return expense
