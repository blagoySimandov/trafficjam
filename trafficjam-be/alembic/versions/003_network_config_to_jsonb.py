"""convert network_config from text to jsonb

Revision ID: 003
Revises: 002
Create Date: 2026-03-01 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "scenarios",
        "network_config",
        type_=JSONB,
        postgresql_using="network_config::jsonb",
        nullable=True,
        server_default=sa.text("'{}'::jsonb"),
    )


def downgrade() -> None:
    op.alter_column(
        "scenarios",
        "network_config",
        type_=sa.Text(),
        postgresql_using="network_config::text",
        nullable=False,
        server_default=sa.text("'{}'"),
    )
