import { useQuery } from "@tanstack/react-query";
import { DeckGL, TripsLayer, ScatterplotLayer } from "deck.gl";
import { Map } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAP_STYLE, MAPBOX_TOKEN } from "../../constants/map";
import { loadTrips, getVehiclePositions } from "../../event-processing";
import type { Trip } from "../../event-processing";
import { useSimulationTime } from "./hooks/use-simulation-time";
import { PlaybackBar } from "./components/playback-bar";
import { INITIAL_STATE_CORK } from "./constants";

export function Visualizer() {
  const { data: trips = [] } = useQuery({
    queryKey: ["trips"],
    queryFn: loadTrips,
  });
  const simulation = useSimulationTime(trips);
  const positions = getVehiclePositions(trips, simulation.time);

  const layers = [
    new TripsLayer({
      id: "trails",
      data: trips,
      getPath: (d: Trip) => d.path,
      getTimestamps: (d: Trip) => d.timestamps,
      getColor: [253, 128, 93],
      widthMinPixels: 2,
      trailLength: 300,
      currentTime: simulation.time,
    }),
    new ScatterplotLayer({
      id: "cars",
      data: positions,
      getPosition: (d: [number, number]) => d,
      getFillColor: [255, 220, 0],
      getRadius: 30,
      radiusMinPixels: 4,
      radiusMaxPixels: 8,
    }),
  ];

  return (
    <DeckGL initialViewState={INITIAL_STATE_CORK} controller layers={layers}>
      <Map mapStyle={MAP_STYLE} mapboxAccessToken={MAPBOX_TOKEN} />
      <PlaybackBar simulation={simulation} />
    </DeckGL>
  );
}
