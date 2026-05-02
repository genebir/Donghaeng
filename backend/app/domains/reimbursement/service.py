from collections.abc import Sequence
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.expense.models import Expense, ExpenseStatus
from app.domains.reimbursement.models import Reimbursement, ReimbursementStatus
from app.domains.user.models import User
from app.domains.reimbursement.schemas import (
    ReimbursementComplete,
    ReimbursementCreate,
    ReimbursementPublic,
)


async def preview(
    db: AsyncSession,
    team_id: UUID,
) -> list[dict]:
    """Group all approved+unreimbursed expenses by purchaser. No DB write."""
    stmt = select(Expense).where(
        Expense.team_id == team_id,
        Expense.status == ExpenseStatus.APPROVED,
        Expense.reimbursement_id.is_(None),
    )
    expenses = list((await db.execute(stmt)).scalars())

    by_recipient: dict[UUID, list[Expense]] = {}
    for expense in expenses:
        by_recipient.setdefault(expense.purchaser_user_id, []).append(expense)

    # Fetch User records for all recipients to get names
    recipient_user_ids = list(by_recipient.keys())
    users_by_id: dict[UUID, User] = {}
    if recipient_user_ids:
        user_rows = list(
            (
                await db.execute(select(User).where(User.id.in_(recipient_user_ids)))
            ).scalars()
        )
        users_by_id = {u.id: u for u in user_rows}

    result = []
    for recipient_user_id, exps in by_recipient.items():
        total = sum(e.amount for e in exps)
        by_category: dict[str, Decimal] = {}
        for e in exps:
            cat = e.category.value if hasattr(e.category, "value") else str(e.category)
            by_category[cat] = by_category.get(cat, Decimal("0")) + e.amount
        user = users_by_id.get(recipient_user_id)
        result.append(
            {
                "recipient_user_id": recipient_user_id,
                "recipient_name": user.name if user else None,
                "total_amount": total,
                "by_category": by_category,
                "expense_count": len(exps),
            }
        )
    return result


async def create(
    db: AsyncSession,
    team_id: UUID,
    payload: ReimbursementCreate,
    *,
    actor_user_id: UUID,
) -> tuple[Reimbursement, list[Expense]]:
    """Create a Reimbursement (status=draft) and link matching approved expenses."""
    stmt = select(Expense).where(
        Expense.team_id == team_id,
        Expense.purchaser_user_id == payload.recipient_user_id,
        Expense.status == ExpenseStatus.APPROVED,
        Expense.reimbursement_id.is_(None),
    )
    if payload.include_expense_ids is not None:
        stmt = stmt.where(Expense.id.in_(payload.include_expense_ids))

    expenses = list((await db.execute(stmt)).scalars())
    if not expenses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="정산할 승인된 지출이 없습니다.",
        )

    total_amount = sum(e.amount for e in expenses)

    reimbursement = Reimbursement(
        team_id=team_id,
        recipient_user_id=payload.recipient_user_id,
        created_by_user_id=actor_user_id,
        status=ReimbursementStatus.DRAFT,
        total_amount=total_amount,
        currency=expenses[0].currency if expenses else "KRW",
    )
    db.add(reimbursement)
    await db.flush()  # get the id

    for e in expenses:
        e.reimbursement_id = reimbursement.id

    await db.commit()
    await db.refresh(reimbursement)
    return reimbursement, expenses


async def list_reimbursements(
    db: AsyncSession,
    team_id: UUID,
    *,
    status_filter: ReimbursementStatus | None = None,
    recipient_user_id: UUID | None = None,
) -> Sequence[Reimbursement]:
    stmt = (
        select(Reimbursement)
        .where(Reimbursement.team_id == team_id)
        .order_by(Reimbursement.created_at.desc())
    )
    if status_filter is not None:
        stmt = stmt.where(Reimbursement.status == status_filter)
    if recipient_user_id is not None:
        stmt = stmt.where(Reimbursement.recipient_user_id == recipient_user_id)
    return list((await db.execute(stmt)).scalars())


async def get(
    db: AsyncSession,
    reimbursement_id: UUID,
) -> ReimbursementPublic:
    """Fetch reimbursement + its linked expenses. Returns a populated schema."""
    reimbursement = (
        await db.execute(
            select(Reimbursement).where(Reimbursement.id == reimbursement_id)
        )
    ).scalar_one_or_none()
    if reimbursement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="정산 내역을 찾을 수 없습니다.",
        )
    expenses = list(
        (
            await db.execute(
                select(Expense).where(Expense.reimbursement_id == reimbursement.id)
            )
        ).scalars()
    )
    pub = ReimbursementPublic.model_validate(reimbursement)
    from app.domains.expense.schemas import ExpensePublic

    pub.expenses = [ExpensePublic.model_validate(e) for e in expenses]

    # Populate recipient bank info from the User table
    recipient_user = (
        await db.execute(select(User).where(User.id == reimbursement.recipient_user_id))
    ).scalar_one_or_none()
    if recipient_user is not None:
        pub.recipient_name = recipient_user.name
        pub.recipient_bank_name = recipient_user.bank_name
        pub.recipient_bank_account_holder = recipient_user.bank_account_holder
        if recipient_user.bank_account_number:
            raw = recipient_user.bank_account_number
            pub.recipient_bank_account_number_masked = "****" + raw[-4:] if len(raw) >= 4 else "****"
        else:
            pub.recipient_bank_account_number_masked = None

    return pub


async def confirm(
    db: AsyncSession,
    reimbursement: Reimbursement,
) -> Reimbursement:
    if reimbursement.status != ReimbursementStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="초안 상태의 정산만 확정할 수 있습니다.",
        )
    reimbursement.status = ReimbursementStatus.CONFIRMED
    await db.commit()
    await db.refresh(reimbursement)
    return reimbursement


async def complete(
    db: AsyncSession,
    reimbursement: Reimbursement,
    payload: ReimbursementComplete,
) -> Reimbursement:
    if reimbursement.status != ReimbursementStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="확정 상태의 정산만 완료 처리할 수 있습니다.",
        )
    # Mark all linked expenses as reimbursed
    expenses = list(
        (
            await db.execute(
                select(Expense).where(Expense.reimbursement_id == reimbursement.id)
            )
        ).scalars()
    )
    for e in expenses:
        e.status = ExpenseStatus.REIMBURSED

    reimbursement.status = ReimbursementStatus.COMPLETED
    reimbursement.transfer_method = payload.transfer_method
    reimbursement.transfer_reference = payload.transfer_reference
    reimbursement.notes = payload.notes
    reimbursement.completed_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(reimbursement)
    return reimbursement


async def reopen(
    db: AsyncSession,
    reimbursement: Reimbursement,
) -> Reimbursement:
    """Reset completed → draft and restore expense statuses to approved."""
    if reimbursement.status != ReimbursementStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="완료된 정산만 재개할 수 있습니다.",
        )
    expenses = list(
        (
            await db.execute(
                select(Expense).where(Expense.reimbursement_id == reimbursement.id)
            )
        ).scalars()
    )
    for e in expenses:
        e.status = ExpenseStatus.APPROVED

    reimbursement.status = ReimbursementStatus.DRAFT
    reimbursement.completed_at = None
    await db.commit()
    await db.refresh(reimbursement)
    return reimbursement


async def get_my_summary(
    db: AsyncSession,
    team_id: UUID,
    user_id: UUID,
) -> dict:
    """Return the current user's pending amount + their reimbursement list."""
    pending_expenses = list(
        (
            await db.execute(
                select(Expense).where(
                    Expense.team_id == team_id,
                    Expense.purchaser_user_id == user_id,
                    Expense.status == ExpenseStatus.APPROVED,
                    Expense.reimbursement_id.is_(None),
                )
            )
        ).scalars()
    )

    reimbursements = list(
        (
            await db.execute(
                select(Reimbursement)
                .where(
                    Reimbursement.team_id == team_id,
                    Reimbursement.recipient_user_id == user_id,
                )
                .order_by(Reimbursement.created_at.desc())
            )
        ).scalars()
    )

    pending_amount = sum(e.amount for e in pending_expenses)

    return {
        "pending_amount": str(pending_amount),
        "pending_expense_count": len(pending_expenses),
        "reimbursements": [
            ReimbursementPublic.model_validate(r).model_dump(mode="json")
            for r in reimbursements
        ],
    }


async def _require_reimbursement(
    db: AsyncSession,
    reimbursement_id: UUID,
) -> Reimbursement:
    """Fetch Reimbursement or raise 404."""
    obj = (
        await db.execute(
            select(Reimbursement).where(Reimbursement.id == reimbursement_id)
        )
    ).scalar_one_or_none()
    if obj is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="정산 내역을 찾을 수 없습니다.",
        )
    return obj
