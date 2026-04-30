"""0001_initial: organization, user, org_membership

Revision ID: 0001
Revises:
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "organization",
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("logo_url", sa.String(length=1024), nullable=True),
        sa.Column("primary_color", sa.String(length=16), nullable=True),
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
        sa.PrimaryKeyConstraint("id", name=op.f("pk_organization")),
        sa.UniqueConstraint("slug", name=op.f("uq_organization_slug")),
    )
    op.create_table(
        "user",
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("profile_image_url", sa.String(length=1024), nullable=True),
        sa.Column("oauth_provider", sa.String(length=32), nullable=True),
        sa.Column("oauth_subject", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("bank_name", sa.String(length=64), nullable=True),
        sa.Column("bank_account_number", sa.String(length=255), nullable=True),
        sa.Column("bank_account_holder", sa.String(length=120), nullable=True),
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
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user")),
        sa.UniqueConstraint("email", name=op.f("uq_user_email")),
        sa.UniqueConstraint(
            "oauth_provider",
            "oauth_subject",
            name="uq_user_oauth_identity",
        ),
    )
    op.create_table(
        "org_membership",
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column(
            "role",
            sa.Enum(
                "OWNER",
                "ADMIN",
                "MEMBER",
                name="org_role",
                native_enum=False,
                length=16,
            ),
            nullable=False,
        ),
        sa.Column(
            "church_position",
            sa.Enum(
                "VILLAGE_HEAD",
                "SHEPHERD",
                "VICE_SHEPHERD",
                "SHEEP",
                "OTHER",
                name="church_position",
                native_enum=False,
                length=16,
            ),
            nullable=True,
        ),
        sa.Column("village_name", sa.String(length=64), nullable=True),
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
            ["organization_id"],
            ["organization.id"],
            name=op.f("fk_org_membership_organization_id_organization"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["user.id"],
            name=op.f("fk_org_membership_user_id_user"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_org_membership")),
        sa.UniqueConstraint(
            "organization_id",
            "user_id",
            name="uq_org_membership_org_user",
        ),
    )
    op.create_index(
        op.f("ix_org_membership_organization_id"),
        "org_membership",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_org_membership_user_id"),
        "org_membership",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_org_membership_user_id"), table_name="org_membership")
    op.drop_index(op.f("ix_org_membership_organization_id"), table_name="org_membership")
    op.drop_table("org_membership")
    op.drop_table("user")
    op.drop_table("organization")
