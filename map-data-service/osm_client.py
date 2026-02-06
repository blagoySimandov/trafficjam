import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


# TODO: we should download the data we need and not rely on the overpass api.
def build_query(min_lat: float, min_lng: float, max_lat: float, max_lng: float) -> str:
    bbox = f"{min_lat},{min_lng},{max_lat},{max_lng}"
    return f"""
[out:json][timeout:60];
(
  way["highway"]["highway"!~"footway|path|cycleway|pedestrian|steps|bridleway|corridor|service"]({bbox});
  way["building"]({bbox});
  relation["route"~"bus|tram|train|subway|light_rail|ferry"]({bbox});
);
out body;
>;
out skel qt;
"""


async def fetch_osm_data(
    min_lat: float, min_lng: float, max_lat: float, max_lng: float
) -> dict:
    query = build_query(min_lat, min_lng, max_lat, max_lng)
    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.post(OVERPASS_URL, data={"data": query})
        response.raise_for_status()
        return response.json()
