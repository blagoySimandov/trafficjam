import json
from pyproj import Transformer

t = Transformer.from_crs("EPSG:32629", "EPSG:4326", always_xy=True)

with open("trips.json") as f:
    trips = json.load(f)

for trip in trips:
    trip["path"] = [list(t.transform(x, y)) for x, y in trip["path"]]

with open("trips_wgs84.json", "w") as f:
    json.dump(trips, f)

print(f"Reprojected {len(trips)} trips")
