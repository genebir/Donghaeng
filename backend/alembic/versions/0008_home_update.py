"""0008_home_update

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "home_update",
        sa.Column("team_id", sa.UUID(), nullable=False),
        sa.Column("author_user_id", sa.UUID(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "draft",
                "published",
                name="home_update_status",
                native_enum=False,
                length=16,
            ),
            server_default="draft",
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("content", sa.String(length=10000), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
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
            name=op.f("fk_home_update_team_id_team"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["author_user_id"],
            ["user.id"],
            name=op.f("fk_home_update_author_user_id_user"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_home_update")),
    )
    op.create_index(
        "ix_home_update_team_id_status",
        "home_update",
        ["team_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_home_update_team_id_published_at",
        "home_update",
        ["team_id", "published_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_home_update_team_id_published_at", table_name="home_update")
    op.drop_index("ix_home_update_team_id_status", table_name="home_update")
    op.drop_table("home_update")
