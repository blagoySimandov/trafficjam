from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import NetworkResponse
from config import get_settings
from gcs_client import fetch_network_from_gcs, filter_network_by_bounds
from overpass_client import fetch_network_from_overpass

app = FastAPI(
    title="Map Data Service",
    description="Fetch network data from Google Cloud Storage for traffic simulation",
    version="1.0.0",
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

    settings = get_settings()

    if settings.data_source == "overpass":
        return await _fetch_from_overpass(min_lat, min_lng, max_lat, max_lng)

    return await _fetch_from_gcs(min_lat, min_lng, max_lat, max_lng)


async def _fetch_from_overpass(
    min_lat: float, min_lng: float, max_lat: float, max_lng: float
) -> NetworkResponse:
    try:
        return await fetch_network_from_overpass(min_lat, min_lng, max_lat, max_lng)
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"Failed to fetch from Overpass API: {str(e)}"
        )


async def _fetch_from_gcs(
    min_lat: float, min_lng: float, max_lat: float, max_lng: float
) -> NetworkResponse:
    try:
        full_network = await fetch_network_from_gcs()
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"Failed to fetch network data from GCS: {str(e)}"
        )
    try:
        return filter_network_by_bounds(full_network, min_lat, min_lng, max_lat, max_lng)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to filter network data: {str(e)}"
        )


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    """This lets you run the file directly with python main.py
        instead of using the uvicorn command"""
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
