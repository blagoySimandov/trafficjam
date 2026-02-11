import csv
import zipfile
import io
import logging
from pathlib import Path
from typing import Optional

from .schedule import Schedule, Stop, Route, Trip, StopTime

logger = logging.getLogger(__name__)


class GTFSParser:
    """Parser for GTFS (General Transit Feed Specification) data."""

    def __init__(self):
        self.schedule = Schedule()

    def parse_zip(self, gtfs_path: str | Path) -> Schedule:
        """Parse a GTFS zip file and return a Schedule."""
        gtfs_path = Path(gtfs_path)

        if not gtfs_path.exists():
            raise FileNotFoundError(f"GTFS file not found: {gtfs_path}")

        with zipfile.ZipFile(gtfs_path, "r") as zf:
            file_list = zf.namelist()

            if "stops.txt" in file_list:
                self._parse_stops(zf)

            if "routes.txt" in file_list:
                self._parse_routes(zf)

            if "trips.txt" in file_list:
                self._parse_trips(zf)

            if "stop_times.txt" in file_list:
                self._parse_stop_times(zf)

        logger.info(
            f"Parsed GTFS: {len(self.schedule.stops)} stops, "
            f"{len(self.schedule.routes)} routes, "
            f"{len(self.schedule.trips)} trips, "
            f"{len(self.schedule.stop_times)} stop times"
        )

        return self.schedule

    def parse_directory(self, gtfs_dir: str | Path) -> Schedule:
        """Parse GTFS files from a directory."""
        gtfs_dir = Path(gtfs_dir)

        if not gtfs_dir.is_dir():
            raise NotADirectoryError(f"GTFS directory not found: {gtfs_dir}")

        stops_file = gtfs_dir / "stops.txt"
        if stops_file.exists():
            self._parse_stops_file(stops_file)

        routes_file = gtfs_dir / "routes.txt"
        if routes_file.exists():
            self._parse_routes_file(routes_file)

        trips_file = gtfs_dir / "trips.txt"
        if trips_file.exists():
            self._parse_trips_file(trips_file)

        stop_times_file = gtfs_dir / "stop_times.txt"
        if stop_times_file.exists():
            self._parse_stop_times_file(stop_times_file)

        logger.info(
            f"Parsed GTFS: {len(self.schedule.stops)} stops, "
            f"{len(self.schedule.routes)} routes, "
            f"{len(self.schedule.trips)} trips, "
            f"{len(self.schedule.stop_times)} stop times"
        )

        return self.schedule

    def _parse_stops(self, zf: zipfile.ZipFile) -> None:
        """Parse stops.txt from zip file."""
        with zf.open("stops.txt") as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))
            for row in reader:
                stop = Stop(
                    stop_id=row["stop_id"],
                    name=row.get("stop_name", ""),
                    lat=float(row["stop_lat"]),
                    lon=float(row["stop_lon"]),
                    location_type=int(row.get("location_type", 0) or 0),
                )
                self.schedule.stops[stop.stop_id] = stop

    def _parse_stops_file(self, path: Path) -> None:
        """Parse stops.txt from file."""
        with open(path, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                stop = Stop(
                    stop_id=row["stop_id"],
                    name=row.get("stop_name", ""),
                    lat=float(row["stop_lat"]),
                    lon=float(row["stop_lon"]),
                    location_type=int(row.get("location_type", 0) or 0),
                )
                self.schedule.stops[stop.stop_id] = stop

    def _parse_routes(self, zf: zipfile.ZipFile) -> None:
        """Parse routes.txt from zip file."""
        with zf.open("routes.txt") as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))
            for row in reader:
                route = Route(
                    route_id=row["route_id"],
                    route_short_name=row.get("route_short_name", ""),
                    route_long_name=row.get("route_long_name", ""),
                    route_type=int(row.get("route_type", 3)),
                )
                self.schedule.routes[route.route_id] = route

    def _parse_routes_file(self, path: Path) -> None:
        """Parse routes.txt from file."""
        with open(path, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                route = Route(
                    route_id=row["route_id"],
                    route_short_name=row.get("route_short_name", ""),
                    route_long_name=row.get("route_long_name", ""),
                    route_type=int(row.get("route_type", 3)),
                )
                self.schedule.routes[route.route_id] = route

    def _parse_trips(self, zf: zipfile.ZipFile) -> None:
        """Parse trips.txt from zip file."""
        with zf.open("trips.txt") as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))
            for row in reader:
                trip = Trip(
                    trip_id=row["trip_id"],
                    route_id=row["route_id"],
                    service_id=row["service_id"],
                    trip_headsign=row.get("trip_headsign"),
                )
                self.schedule.trips[trip.trip_id] = trip

    def _parse_trips_file(self, path: Path) -> None:
        """Parse trips.txt from file."""
        with open(path, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                trip = Trip(
                    trip_id=row["trip_id"],
                    route_id=row["route_id"],
                    service_id=row["service_id"],
                    trip_headsign=row.get("trip_headsign"),
                )
                self.schedule.trips[trip.trip_id] = trip

    def _parse_stop_times(self, zf: zipfile.ZipFile) -> None:
        """Parse stop_times.txt from zip file."""
        with zf.open("stop_times.txt") as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))
            for row in reader:
                stop_time = StopTime(
                    trip_id=row["trip_id"],
                    stop_id=row["stop_id"],
                    arrival_time=self._normalize_time(row["arrival_time"]),
                    departure_time=self._normalize_time(row["departure_time"]),
                    stop_sequence=int(row["stop_sequence"]),
                )
                self.schedule.stop_times.append(stop_time)

    def _parse_stop_times_file(self, path: Path) -> None:
        """Parse stop_times.txt from file."""
        with open(path, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                stop_time = StopTime(
                    trip_id=row["trip_id"],
                    stop_id=row["stop_id"],
                    arrival_time=self._normalize_time(row["arrival_time"]),
                    departure_time=self._normalize_time(row["departure_time"]),
                    stop_sequence=int(row["stop_sequence"]),
                )
                self.schedule.stop_times.append(stop_time)

    def _normalize_time(self, time_str: str) -> str:
        """Normalize time string to HH:MM:SS format.

        GTFS allows times > 24:00:00 for trips crossing midnight.
        We normalize these to wrap around.
        """
        time_str = time_str.strip()
        parts = time_str.split(":")
        if len(parts) != 3:
            return time_str

        hours = int(parts[0]) % 24
        minutes = int(parts[1])
        seconds = int(parts[2])

        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
