"""0005_schedule_checklist

Revision ID: 0005
Revises: 0004
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "checklist_item",
        sa.Column("team_id", sa.UUID(), nullable=False),
        sa.Column(
            "category",
            sa.Enum(
                "TEAM_GEAR",
                "PERSONAL",
                "MINISTRY",
                "DOCS",
                "MISC",
                name="checklist_category",
                native_enum=False,
                length=16,
            ),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("quantity", sa.String(length=64), nullable=True),
        sa.Column("owner_member_id", sa.UUID(), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "todo",
                "in_progress",
                "done",
                name="checklist_status",
                native_enum=False,
                length=16,
            ),
            server_default="todo",
            nullable=False,
        ),
        sa.Column("cost_amount", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column(
            "cost_currency",
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
            ["owner_member_id"],
            ["team_member.id"],
            name=op.f("fk_checklist_item_owner_member_id_team_member"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["team_id"],
            ["team.id"],
            name=op.f("fk_checklist_item_team_id_team"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_checklist_item")),
    )
    op.create_index(
        op.f("ix_checklist_item_team_id"),
        "checklist_item",
        ["team_id"],
        unique=False,
    )
    op.create_table(
        "schedule_item",
        sa.Column("team_id", sa.UUID(), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column(
            "kind",
            sa.Enum(
                "TRAVEL",
                "WORSHIP",
                "VBS",
                "MEAL",
                "FREE",
                "PRAYER",
                "MEETING",
                "OTHER",
                name="schedule_kind",
                native_enum=False,
                length=16,
            ),
            nullable=True,
        ),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("description", sa.String(length=2000), nullable=True),
        sa.Column("owner_member_id", sa.UUID(), nullable=True),
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
            ["owner_member_id"],
            ["team_member.id"],
            name=op.f("fk_schedule_item_owner_member_id_team_member"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["team_id"],
            ["team.id"],
            name=op.f("fk_schedule_item_team_id_team"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_schedule_item")),
    )
    op.create_index(
        "ix_schedule_item_team_id_starts_at",
        "schedule_item",
        ["team_id", "starts_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_schedule_item_team_id_starts_at", table_name="schedule_item")
    op.drop_table("schedule_item")
    op.drop_index(op.f("ix_checklist_item_team_id"), table_name="checklist_item")
    op.drop_table("checklist_item")
