"""0012_outreach_membership

Revision ID: 0012
Revises: 0011
Create Date: 2026-05-02
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID as PGUUID

revision: str = "0012"
down_revision: str | None = "0011"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "outreach_membership",
        sa.Column("id", PGUUID(as_uuid=True), primary_key=True),
        sa.Column(
            "outreach_id",
            PGUUID(as_uuid=True),
            sa.ForeignKey("outreach.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            PGUUID(as_uuid=True),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.String(16), nullable=False),
        sa.Column(
            "team_id",
            PGUUID(as_uuid=True),
            sa.ForeignKey("team.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "outreach_id", "user_id", name="uq_outreach_membership_outreach_user"
        ),
    )
    op.create_index(
        "ix_outreach_membership_outreach_id", "outreach_membership", ["outreach_id"]
    )
    op.create_index(
        "ix_outreach_membership_user_id", "outreach_membership", ["user_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_outreach_membership_user_id", table_name="outreach_membership")
    op.drop_index("ix_outreach_membership_outreach_id", table_name="outreach_membership")
    op.drop_table("outreach_membership")
