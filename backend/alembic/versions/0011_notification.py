"""0011_notification

Revision ID: 0011
Revises: 0010
Create Date: 2026-05-02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0011"
down_revision: str | None = "0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "notification",
        sa.Column("recipient_user_id", sa.UUID(), nullable=False),
        sa.Column("team_id", sa.UUID(), nullable=False),
        sa.Column(
            "kind",
            sa.Enum(
                "expense_approved",
                "expense_rejected",
                "reimbursement_confirmed",
                "reimbursement_completed",
                "testimony_new",
                name="notification_kind",
                native_enum=False,
                length=40,
            ),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("body", sa.String(length=500), nullable=True),
        sa.Column(
            "is_read",
            sa.Boolean(),
            server_default="false",
            nullable=False,
        ),
        sa.Column("ref_id", sa.UUID(), nullable=True),
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
            ["recipient_user_id"],
            ["user.id"],
            name=op.f("fk_notification_recipient_user_id_user"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["team_id"],
            ["team.id"],
            name=op.f("fk_notification_team_id_team"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notification")),
    )
    op.create_index(
        "ix_notification_recipient_user_id",
        "notification",
        ["recipient_user_id"],
        unique=False,
    )
    op.create_index(
        "ix_notification_recipient_is_read",
        "notification",
        ["recipient_user_id", "is_read"],
        unique=False,
    )
    op.create_index(
        "ix_notification_recipient_created_at",
        "notification",
        ["recipient_user_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_notification_recipient_created_at", table_name="notification")
    op.drop_index("ix_notification_recipient_is_read", table_name="notification")
    op.drop_index("ix_notification_recipient_user_id", table_name="notification")
    op.drop_table("notification")
