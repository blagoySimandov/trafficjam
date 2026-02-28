"""
Alembic environment configuration for trafficjam-be.

Uses async SQLAlchemy (asyncpg) and reads DB URL from config.py.
"""

import sys
import os
import asyncio
from logging.config import fileConfig

# Add the project root (trafficjam-be/) to the Python path
# so that `from db.models import Base` and `from config import get_settings` resolve correctly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Import our models so Alembic can detect table definitions
from db.models import Base
from config import get_settings

# Alembic Config object — provides access to values in alembic.ini
config = context.config

# Inject the DB URL from our application config (overrides alembic.ini)
settings = get_settings()
# Alembic needs a synchronous URL (replace asyncpg driver with psycopg2 for migrations)
sync_url = settings.database_url.replace("postgresql+asyncpg", "postgresql+psycopg")
config.set_main_option("sqlalchemy.url", sync_url)

# Set up loggers from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# The metadata Alembic will compare against the DB to detect changes
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations without a live DB connection.
    Useful for generating SQL scripts to review before applying.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations using an async engine (matches our app's asyncpg setup)."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Entry point for running migrations against a live DB."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
