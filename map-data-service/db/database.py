from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from config import get_settings

settings = get_settings()


def _build_engine(url: str):
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    ssl_mode = params.pop("sslmode", [None])[0]
    channel_binding = params.pop("channel_binding", [None])[0]
    clean_url = urlunparse(parsed._replace(query=urlencode({k: v[0] for k, v in params.items()})))
    connect_args = {"statement_cache_size": 0, **({"ssl": True} if ssl_mode else {})}
    return create_async_engine(
        clean_url, pool_pre_ping=True, pool_size=5, max_overflow=10, pool_recycle=300, connect_args=connect_args
    )


engine = _build_engine(settings.database_url)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


