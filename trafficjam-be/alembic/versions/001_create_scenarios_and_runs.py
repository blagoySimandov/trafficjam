"""create scenarios and runs tables

Revision ID: 001
Revises:
Create Date: 2026-02-25 12:45:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create scenarios table first — runs has a FK referencing it
    op.create_table(
        "scenarios",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("network_config", postgresql.JSONB(), nullable=False),
        sa.Column("plan_params", postgresql.JSONB(), nullable=False),
        sa.Column("matsim_config", postgresql.JSONB(), nullable=True),
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
        sa.PrimaryKeyConstraint("id"),
    )

    # Create the RunStatus enum type in Postgres
    runstatus_enum = postgresql.ENUM(
        "pending", "running", "completed", "failed",
        name="runstatus",
        create_type=True,
    )
    runstatus_enum.create(op.get_bind())

    # Create runs table, referencing scenarios
    op.create_table(
        "runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("scenario_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("status", sa.Enum("pending", "running", "completed", "failed", name="runstatus"), nullable=False, server_default="pending"),
        sa.Column("nats_subject", sa.Text(), nullable=True),
        sa.Column("event_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
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
        sa.ForeignKeyConstraint(["scenario_id"], ["scenarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Index on scenario_id for fast lookups
    op.create_index("ix_runs_scenario_id", "runs", ["scenario_id"])


def downgrade() -> None:
    # Drop in reverse order to respect FK constraint
    op.drop_index("ix_runs_scenario_id", table_name="runs")
    op.drop_table("runs")

    # Drop the enum type
    runstatus_enum = postgresql.ENUM(name="runstatus", create_type=False)
    runstatus_enum.drop(op.get_bind())

    op.drop_table("scenarios")
