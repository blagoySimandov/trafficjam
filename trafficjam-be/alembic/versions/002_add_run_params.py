"""add iterations, random_seed, note to runs

Revision ID: 002
Revises: 001
Create Date: 2026-03-01 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("runs", sa.Column("iterations", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("runs", sa.Column("random_seed", sa.Integer(), nullable=True))
    op.add_column("runs", sa.Column("note", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("runs", "note")
    op.drop_column("runs", "random_seed")
    op.drop_column("runs", "iterations")
