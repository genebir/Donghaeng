"""0006_budget_expense

Revision ID: 0006
Revises: 0005
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "budget",
        sa.Column("team_id", sa.UUID(), nullable=False),
        sa.Column(
            "category",
            sa.Enum(
                "TRANSPORT",
                "LODGING",
                "MEAL",
                "MINISTRY",
                "GIFT",
                "SUPPLIES",
                "MEDICAL",
                "MISC",
                name="expense_category",
                native_enum=False,
                length=16,
            ),
            nullable=False,
        ),
        sa.Column(
            "planned_amount", sa.Numeric(precision=12, scale=2), nullable=False
        ),
        sa.Column(
            "currency",
            sa.String(length=3),
            server_default="KRW",
            nullable=False,
        ),
        sa.Column("notes", sa.String(length=2000), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["team_id"],
            ["team.id"],
            name=op.f("fk_budget_team_id_team"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_budget")),
        sa.UniqueConstraint(
            "team_id", "category", name="uq_budget_team_category"
        ),
    )
    op.create_table(
        "expense",
        sa.Column("team_id", sa.UUID(), nullable=False),
        sa.Column("purchaser_user_id", sa.UUID(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column(
            "currency",
            sa.String(length=3),
            server_default="KRW",
            nullable=False,
        ),
        sa.Column("spent_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("vendor", sa.String(length=200), nullable=True),
        sa.Column(
            "category",
            sa.Enum(
                "TRANSPORT",
                "LODGING",
                "MEAL",
                "MINISTRY",
                "GIFT",
                "SUPPLIES",
                "MEDICAL",
                "MISC",
                name="expense_category",
                native_enum=False,
                length=16,
            ),
            nullable=False,
        ),
        sa.Column("description", sa.String(length=500), nullable=False),
        sa.Column(
            "payment_method",
            sa.Enum(
                "PERSONAL_CARD",
                "PERSONAL_CASH",
                "CHURCH_CARD",
                "OTHER",
                name="payment_method",
                native_enum=False,
                length=24,
            ),
            nullable=True,
        ),
        sa.Column("receipt_media_id", sa.UUID(), nullable=True),
        sa.Column("checklist_item_id", sa.UUID(), nullable=True),
        sa.Column(
            "ocr_raw", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "approved",
                "rejected",
                "reimbursed",
                name="expense_status",
                native_enum=False,
                length=16,
            ),
            server_default="pending",
            nullable=False,
        ),
        sa.Column("approved_by_user_id", sa.UUID(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.String(length=500), nullable=True),
        sa.Column("reimbursement_id", sa.UUID(), nullable=True),
        sa.Column("notes", sa.String(length=2000), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["approved_by_user_id"],
            ["user.id"],
            name=op.f("fk_expense_approved_by_user_id_user"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["checklist_item_id"],
            ["checklist_item.id"],
            name=op.f("fk_expense_checklist_item_id_checklist_item"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["purchaser_user_id"],
            ["user.id"],
            name=op.f("fk_expense_purchaser_user_id_user"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["team_id"],
            ["team.id"],
            name=op.f("fk_expense_team_id_team"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_expense")),
    )
    op.create_index(
        "ix_expense_team_id_category",
        "expense",
        ["team_id", "category"],
        unique=False,
    )
    op.create_index(
        "ix_expense_team_id_purchaser_status",
        "expense",
        ["team_id", "purchaser_user_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_expense_team_id_spent_at",
        "expense",
        ["team_id", "spent_at"],
        unique=False,
    )
    op.create_index(
        "ix_expense_team_id_status",
        "expense",
        ["team_id", "status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_expense_team_id_status", table_name="expense")
    op.drop_index("ix_expense_team_id_spent_at", table_name="expense")
    op.drop_index("ix_expense_team_id_purchaser_status", table_name="expense")
    op.drop_index("ix_expense_team_id_category", table_name="expense")
    op.drop_table("expense")
    op.drop_table("budget")
