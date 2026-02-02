from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import NetworkResponse
from osm_client import fetch_osm_data
from parser import parse_osm_response

app = FastAPI(
    title="Map Data Service",
    description="Fetch OSM data for traffic simulation",
    version="1.0.0"
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
        osm_data = await fetch_osm_data(min_lat, min_lng, max_lat, max_lng)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch OSM data: {str(e)}")

    try:
        parsed = parse_osm_response(osm_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse OSM data: {str(e)}")

    return NetworkResponse(
        nodes=parsed["nodes"],
        links=parsed["links"],
        buildings=parsed["buildings"],
        transport_routes=parsed["transport_routes"]
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
