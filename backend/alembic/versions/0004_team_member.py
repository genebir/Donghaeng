"""0004_team_member

Revision ID: 0004
Revises: 0003
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "team_member",
        sa.Column("team_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column(
            "role",
            sa.Enum(
                "LEADER",
                "MEMBER",
                name="team_role",
                native_enum=False,
                length=16,
            ),
            server_default="MEMBER",
            nullable=False,
        ),
        sa.Column(
            "part",
            sa.Enum(
                "MEDIA",
                "WORSHIP",
                "TEACHER",
                "FINANCE",
                "MEDICAL",
                "GENERAL",
                name="team_part",
                native_enum=False,
                length=16,
            ),
            nullable=True,
        ),
        sa.Column(
            "is_part_lead", sa.Boolean(), server_default="false", nullable=False
        ),
        sa.Column(
            "emergency_info",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column(
            "meta", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
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
            name=op.f("fk_team_member_team_id_team"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["user.id"],
            name=op.f("fk_team_member_user_id_user"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_team_member")),
        sa.UniqueConstraint(
            "team_id", "user_id", name="uq_team_member_team_user"
        ),
    )
    op.create_index(
        op.f("ix_team_member_team_id"),
        "team_member",
        ["team_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_team_member_user_id"),
        "team_member",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_team_member_user_id"), table_name="team_member")
    op.drop_index(op.f("ix_team_member_team_id"), table_name="team_member")
    op.drop_table("team_member")
