"""0003_team_destination

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "team",
        sa.Column("outreach_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("starts_on", sa.Date(), nullable=True),
        sa.Column("ends_on", sa.Date(), nullable=True),
        sa.Column("description", sa.String(length=2000), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "planning",
                "ongoing",
                "finished",
                "archived",
                name="team_status",
                native_enum=False,
                length=16,
            ),
            server_default="planning",
            nullable=False,
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
            ["outreach_id"],
            ["outreach.id"],
            name=op.f("fk_team_outreach_id_outreach"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_team")),
        sa.UniqueConstraint("outreach_id", "slug", name="uq_team_outreach_slug"),
    )
    op.create_index(op.f("ix_team_outreach_id"), "team", ["outreach_id"], unique=False)
    op.create_table(
        "destination",
        sa.Column("team_id", sa.UUID(), nullable=False),
        sa.Column("church_name", sa.String(length=120), nullable=False),
        sa.Column("address", sa.String(length=255), nullable=True),
        sa.Column("coordinator_name", sa.String(length=120), nullable=True),
        sa.Column("coordinator_phone", sa.String(length=32), nullable=True),
        sa.Column("coordinator_email", sa.String(length=320), nullable=True),
        sa.Column(
            "timezone",
            sa.String(length=64),
            server_default="Asia/Seoul",
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
            name=op.f("fk_destination_team_id_team"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_destination")),
        sa.UniqueConstraint("team_id", name=op.f("uq_destination_team_id")),
    )


def downgrade() -> None:
    op.drop_table("destination")
    op.drop_index(op.f("ix_team_outreach_id"), table_name="team")
    op.drop_table("team")
