from collections.abc import Sequence
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.budget.models import Budget
from app.domains.budget.schemas import (
    BudgetCategorySummary,
    BudgetSummary,
    BudgetSummaryMeta,
    BudgetUpsert,
)
from app.domains.expense.models import (
    Expense,
    ExpenseCategory,
    ExpenseStatus,
)

ZERO = Decimal("0.00")


async def list_entries(db: AsyncSession, team_id: UUID) -> Sequence[Budget]:
    stmt = (
        select(Budget)
        .where(Budget.team_id == team_id)
        .order_by(Budget.category.asc())
    )
    return list((await db.execute(stmt)).scalars())


async def upsert_entries(
    db: AsyncSession, team_id: UUID, payload: BudgetUpsert
) -> Sequence[Budget]:
    rows = [
        {
            "team_id": team_id,
            "category": entry.category,
            "planned_amount": entry.planned_amount,
            "currency": entry.currency,
            "notes": entry.notes,
        }
        for entry in payload.entries
    ]
    stmt = pg_insert(Budget).values(rows)
    stmt = stmt.on_conflict_do_update(
        constraint="uq_budget_team_category",
        set_={
            "planned_amount": stmt.excluded.planned_amount,
            "currency": stmt.excluded.currency,
            "notes": stmt.excluded.notes,
            "updated_at": func.now(),
        },
    )
    await db.execute(stmt)
    await db.commit()
    return await list_entries(db, team_id)


async def summary(db: AsyncSession, team_id: UUID) -> BudgetSummary:
    budget_rows = await list_entries(db, team_id)
    spent_stmt = (
        select(
            Expense.category,
            Expense.status,
            func.coalesce(func.sum(Expense.amount), ZERO),
        )
        .where(Expense.team_id == team_id)
        .group_by(Expense.category, Expense.status)
    )
    rows = (await db.execute(spent_stmt)).all()

    approved_by_cat: dict[ExpenseCategory, Decimal] = {}
    pending_by_cat: dict[ExpenseCategory, Decimal] = {}
    for category, status_, total in rows:
        if status_ in (ExpenseStatus.APPROVED, ExpenseStatus.REIMBURSED):
            approved_by_cat[category] = approved_by_cat.get(category, ZERO) + total
        elif status_ == ExpenseStatus.PENDING:
            pending_by_cat[category] = pending_by_cat.get(category, ZERO) + total

    data: list[BudgetCategorySummary] = []
    total_planned = ZERO
    total_approved = ZERO
    total_pending = ZERO
    seen: set[ExpenseCategory] = set()

    for budget in budget_rows:
        approved = approved_by_cat.get(budget.category, ZERO)
        pending = pending_by_cat.get(budget.category, ZERO)
        data.append(
            BudgetCategorySummary(
                category=budget.category,
                planned_amount=budget.planned_amount,
                spent_approved=approved,
                spent_pending=pending,
                remaining=budget.planned_amount - approved,
                currency=budget.currency,
            )
        )
        seen.add(budget.category)
        total_planned += budget.planned_amount
        total_approved += approved
        total_pending += pending

    # 예산은 없는데 지출만 있는 카테고리도 노출 — 누락 방지.
    leftover = (set(approved_by_cat) | set(pending_by_cat)) - seen
    for category in sorted(leftover, key=lambda c: c.value):
        approved = approved_by_cat.get(category, ZERO)
        pending = pending_by_cat.get(category, ZERO)
        data.append(
            BudgetCategorySummary(
                category=category,
                planned_amount=ZERO,
                spent_approved=approved,
                spent_pending=pending,
                remaining=-approved,
                currency="KRW",
            )
        )
        total_approved += approved
        total_pending += pending

    return BudgetSummary(
        data=data,
        meta=BudgetSummaryMeta(
            total_planned=total_planned,
            total_spent_approved=total_approved,
            total_spent_pending=total_pending,
        ),
    )
