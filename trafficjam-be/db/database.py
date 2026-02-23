from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
