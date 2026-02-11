from dataclasses import dataclass, field
from typing import Optional
from math import radians, sin, cos, sqrt, atan2


@dataclass
class Stop:
    stop_id: str
    name: str
    lat: float
    lon: float
    location_type: int = 0  # 0=stop, 1=station


@dataclass
class Route:
    route_id: str
    route_short_name: str
    route_long_name: str
    route_type: int  # 0=tram, 1=subway, 2=rail, 3=bus


@dataclass
class Trip:
    trip_id: str
    route_id: str
    service_id: str
    trip_headsign: Optional[str] = None


@dataclass
class StopTime:
    trip_id: str
    stop_id: str
    arrival_time: str  # HH:MM:SS
    departure_time: str  # HH:MM:SS
    stop_sequence: int


@dataclass
class Schedule:
    stops: dict[str, Stop] = field(default_factory=dict)
    routes: dict[str, Route] = field(default_factory=dict)
    trips: dict[str, Trip] = field(default_factory=dict)
    stop_times: list[StopTime] = field(default_factory=list)

    def _haversine_distance(
        self, lat1: float, lon1: float, lat2: float, lon2: float
    ) -> float:
        """Calculate distance between two points in meters."""
        R = 6371000  # Earth radius in meters

        lat1_rad = radians(lat1)
        lat2_rad = radians(lat2)
        delta_lat = radians(lat2 - lat1)
        delta_lon = radians(lon2 - lon1)

        a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(
            delta_lon / 2
        ) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))

        return R * c

    def get_stops_near(
        self, lat: float, lon: float, radius_meters: float = 500
    ) -> list[Stop]:
        """Get all stops within radius_meters of the given coordinates."""
        nearby = []
        for stop in self.stops.values():
            distance = self._haversine_distance(lat, lon, stop.lat, stop.lon)
            if distance <= radius_meters:
                nearby.append(stop)
        return nearby

    def get_departures(
        self, stop_id: str, after_time: str, limit: int = 10
    ) -> list[StopTime]:
        """Get departures from a stop after a given time."""
        departures = [st for st in self.stop_times if st.stop_id == stop_id]

        # Filter by time
        departures = [st for st in departures if st.departure_time >= after_time]

        # Sort by departure time and limit
        departures.sort(key=lambda st: st.departure_time)
        return departures[:limit]

    def get_route_for_trip(self, trip_id: str) -> Optional[Route]:
        """Get the route for a given trip."""
        trip = self.trips.get(trip_id)
        if trip:
            return self.routes.get(trip.route_id)
        return None
