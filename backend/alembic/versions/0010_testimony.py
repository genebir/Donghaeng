"""0010_testimony

Revision ID: 0010
Revises: 0009
Create Date: 2026-05-02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # qr_token must come first — testimony references it
    op.create_table(
        "qr_token",
        sa.Column("team_id", sa.UUID(), nullable=False),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("label", sa.String(length=120), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default="true",
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
            ["team_id"],
            ["team.id"],
            name=op.f("fk_qr_token_team_id_team"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_qr_token")),
        sa.UniqueConstraint("token", name=op.f("uq_qr_token_token")),
    )
    op.create_index("ix_qr_token_token", "qr_token", ["token"], unique=True)
    op.create_index("ix_qr_token_team_id", "qr_token", ["team_id"], unique=False)

    op.create_table(
        "testimony",
        sa.Column("team_id", sa.UUID(), nullable=False),
        sa.Column("qr_token_id", sa.UUID(), nullable=True),
        sa.Column("submitter_user_id", sa.UUID(), nullable=True),
        sa.Column(
            "kind",
            sa.Enum(
                "testimony",
                "prayer_request",
                name="testimony_kind",
                native_enum=False,
                length=32,
            ),
            nullable=False,
        ),
        sa.Column(
            "visibility",
            sa.Enum(
                "team",
                "public",
                "anonymous",
                name="testimony_visibility",
                native_enum=False,
                length=16,
            ),
            server_default="team",
            nullable=False,
        ),
        sa.Column("content", sa.String(length=5000), nullable=False),
        sa.Column(
            "is_featured",
            sa.Boolean(),
            server_default="false",
            nullable=False,
        ),
        sa.Column("submitted_name", sa.String(length=80), nullable=True),
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
            name=op.f("fk_testimony_team_id_team"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["qr_token_id"],
            ["qr_token.id"],
            name=op.f("fk_testimony_qr_token_id_qr_token"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["submitter_user_id"],
            ["user.id"],
            name=op.f("fk_testimony_submitter_user_id_user"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_testimony")),
    )
    op.create_index(
        "ix_testimony_team_id_visibility",
        "testimony",
        ["team_id", "visibility"],
        unique=False,
    )
    op.create_index(
        "ix_testimony_team_id_kind",
        "testimony",
        ["team_id", "kind"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_testimony_team_id_kind", table_name="testimony")
    op.drop_index("ix_testimony_team_id_visibility", table_name="testimony")
    op.drop_table("testimony")
    op.drop_index("ix_qr_token_team_id", table_name="qr_token")
    op.drop_index("ix_qr_token_token", table_name="qr_token")
    op.drop_table("qr_token")
