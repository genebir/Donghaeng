"""0007_reimbursement

Revision ID: 0007
Revises: 0006
Create Date: 2026-05-02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Create reimbursement table
    op.create_table(
        "reimbursement",
        sa.Column("team_id", sa.UUID(), nullable=False),
        sa.Column("recipient_user_id", sa.UUID(), nullable=False),
        sa.Column("created_by_user_id", sa.UUID(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "draft",
                "confirmed",
                "completed",
                name="reimbursement_status",
                native_enum=False,
                length=16,
            ),
            server_default="draft",
            nullable=False,
        ),
        sa.Column(
            "total_amount",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
        ),
        sa.Column(
            "currency",
            sa.String(length=3),
            server_default="KRW",
            nullable=False,
        ),
        sa.Column("transfer_method", sa.String(length=64), nullable=True),
        sa.Column("transfer_reference", sa.String(length=500), nullable=True),
        sa.Column("notes", sa.String(length=2000), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
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
            name=op.f("fk_reimbursement_team_id_team"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["recipient_user_id"],
            ["user.id"],
            name=op.f("fk_reimbursement_recipient_user_id_user"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["created_by_user_id"],
            ["user.id"],
            name=op.f("fk_reimbursement_created_by_user_id_user"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_reimbursement")),
    )
    op.create_index(
        "ix_reimbursement_team_id_status",
        "reimbursement",
        ["team_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_reimbursement_team_id_recipient",
        "reimbursement",
        ["team_id", "recipient_user_id"],
        unique=False,
    )

    # 2. Add FK from expense.reimbursement_id → reimbursement.id
    #    The column already exists (added in 0006 without FK).
    op.create_foreign_key(
        "fk_expense_reimbursement_id_reimbursement",
        "expense",
        "reimbursement",
        ["reimbursement_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    # Remove FK from expense first
    op.drop_constraint(
        "fk_expense_reimbursement_id_reimbursement",
        "expense",
        type_="foreignkey",
    )
    # Drop indexes then table
    op.drop_index("ix_reimbursement_team_id_recipient", table_name="reimbursement")
    op.drop_index("ix_reimbursement_team_id_status", table_name="reimbursement")
    op.drop_table("reimbursement")
