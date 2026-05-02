"""0009_media

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0009"
down_revision: str | None = "0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "media_asset",
        sa.Column("team_id", sa.UUID(), nullable=False),
        sa.Column("uploader_user_id", sa.UUID(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "ready",
                "failed",
                name="media_status",
                native_enum=False,
                length=16,
            ),
            server_default="pending",
            nullable=False,
        ),
        sa.Column(
            "kind",
            sa.Enum(
                "photo",
                "video",
                "document",
                name="media_kind",
                native_enum=False,
                length=16,
            ),
            nullable=False,
        ),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("storage_key", sa.String(length=512), nullable=False),
        sa.Column("content_type", sa.String(length=128), nullable=False),
        sa.Column("byte_size", sa.BigInteger(), nullable=True),
        sa.Column(
            "visibility",
            sa.Enum(
                "team",
                "public",
                name="media_visibility",
                native_enum=False,
                length=16,
            ),
            server_default="team",
            nullable=False,
        ),
        sa.Column(
            "is_selected",
            sa.Boolean(),
            server_default="false",
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
            name=op.f("fk_media_asset_team_id_team"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["uploader_user_id"],
            ["user.id"],
            name=op.f("fk_media_asset_uploader_user_id_user"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_media_asset")),
    )
    op.create_index(
        "ix_media_asset_team_id_status",
        "media_asset",
        ["team_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_media_asset_team_id_visibility",
        "media_asset",
        ["team_id", "visibility"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_media_asset_team_id_visibility", table_name="media_asset")
    op.drop_index("ix_media_asset_team_id_status", table_name="media_asset")
    op.drop_table("media_asset")
