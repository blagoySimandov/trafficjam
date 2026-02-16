from contextlib import asynccontextmanager

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import NetworkResponse
from db import engine, MapDataRepository
from db.database import AsyncSessionLocal


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(
    title="Map Data Service",
    description="Fetch map data for traffic simulation",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/network", response_model=NetworkResponse)
async def get_network(
    min_lat: float = Query(..., ge=-90, le=90, description="South boundary"),
    min_lng: float = Query(..., ge=-180, le=180, description="West boundary"),
    max_lat: float = Query(..., ge=-90, le=90, description="North boundary"),
    max_lng: float = Query(..., ge=-180, le=180, description="East boundary"),
):
    if min_lat >= max_lat:
        raise HTTPException(status_code=400, detail="min_lat must be less than max_lat")
    if min_lng >= max_lng:
        raise HTTPException(status_code=400, detail="min_lng must be less than max_lng")

    try:
        repository = MapDataRepository(AsyncSessionLocal)
        return await repository.fetch_network(min_lat, min_lng, max_lat, max_lng)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Failed to fetch network data"
        )


@app.get("/health")
async def health():
    return {"status": "ok"}
