import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query, HTTPException, Response

logger = logging.getLogger(__name__)
from fastapi.middleware.cors import CORSMiddleware

from models import NetworkResponse
from db import engine, MapDataRepository
from db.database import AsyncSessionLocal

CACHE_MAX_AGE = 3600


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


TAGS_METADATA = [
    {
        "name": "network",
        "description": "Spatial queries returning road network, buildings, and public transport data for a geographic bounding box.",
    },
    {
        "name": "ops",
        "description": "Operational endpoints for monitoring service health.",
    },
]

app = FastAPI(
    title="Map Data Service",
    description=(
        "Serves OpenStreetMap-derived network data (nodes, links, buildings, transport routes) "
        "from a PostGIS database for use by the TrafficJam simulation frontend.\n\n"
        "All coordinates are in **WGS 84** (EPSG:4326) as `[longitude, latitude]` pairs. "
        "Responses are cached for 1 hour (`Cache-Control: public, max-age=3600`)."
    ),
    version="2.0.0",
    openapi_tags=TAGS_METADATA,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _validate_bounds(min_lat: float, min_lng: float, max_lat: float, max_lng: float):
    if min_lat >= max_lat:
        raise HTTPException(status_code=400, detail="min_lat must be less than max_lat")
    if min_lng >= max_lng:
        raise HTTPException(status_code=400, detail="min_lng must be less than max_lng")


@app.get(
    "/network",
    response_model=NetworkResponse,
    tags=["network"],
    summary="Fetch network data for a bounding box",
    description=(
        "Returns all road nodes, directed links, buildings, and public transport routes "
        "whose geometry intersects the given WGS 84 bounding box. "
        "The bounding box must have `min_lat < max_lat` and `min_lng < max_lng`."
    ),
    response_description="Network data (nodes, links, buildings, transport routes) within the requested bounding box",
)
async def get_network(
    response: Response,
    min_lat: float = Query(..., ge=-90, le=90, description="South boundary latitude"),
    min_lng: float = Query(..., ge=-180, le=180, description="West boundary longitude"),
    max_lat: float = Query(..., ge=-90, le=90, description="North boundary latitude"),
    max_lng: float = Query(..., ge=-180, le=180, description="East boundary longitude"),
):
    _validate_bounds(min_lat, min_lng, max_lat, max_lng)
    response.headers["Cache-Control"] = f"public, max-age={CACHE_MAX_AGE}"

    try:
        repository = MapDataRepository(AsyncSessionLocal)
        return await repository.fetch_network(min_lat, min_lng, max_lat, max_lng)
    except Exception:
        logger.exception("Failed to fetch network data")
        raise HTTPException(status_code=500, detail="Failed to fetch network data")


@app.get(
    "/health",
    tags=["ops"],
    summary="Health check",
    response_description="Service status",
)
async def health():
    return {"status": "ok"}
