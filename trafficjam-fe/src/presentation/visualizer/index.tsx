import { useQuery } from "@tanstack/react-query";
import { DeckGL, TripsLayer, ScatterplotLayer } from "deck.gl";
import { Map } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAP_STYLE, MAPBOX_TOKEN } from "../../constants/map";
import { loadTrips, getVehiclePositions } from "../../event-processing";
import type { Trip } from "../../event-processing";
import {
  useSimulationTime,
  type SimulationTimeState,
} from "./hooks/use-simulation-time";
import { INITIAL_STATE_CORK, DARK_MAP_STYLE } from "./constants";
import { BackToEditorButton } from "./components/back-button";
import { PlaybackBar } from "./components/playback-bar";

interface VisualizerProps {
  onBack: () => void;
}

// export function Visualizer() {
//   const { data: trips = [] } = useQuery({
//     queryKey: ["trips"],
//     queryFn: loadTrips,
//   });
//   const positions = getVehiclePositions(trips, simulation.time);

function useLayers(trips: Trip[], simulation: SimulationTimeState) {
  return [
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
      data: getVehiclePositions(trips, simulation.time),
      getPosition: (d: [number, number]) => d,
      getFillColor: [255, 220, 0],
      getRadius: 30,
      radiusMinPixels: 4,
      radiusMaxPixels: 8,
    }),
  ];
}

export function Visualizer({ onBack }: VisualizerProps) {
  const { data: trips = [] } = useQuery({
    queryKey: ["trips"],
    queryFn: loadTrips,
  });

  const simulation = useSimulationTime(trips);
  const layers = useLayers(trips, simulation);

  return (
    <DeckGL initialViewState={INITIAL_STATE_CORK} controller layers={layers}>
      <Map mapStyle={DARK_MAP_STYLE} mapboxAccessToken={MAPBOX_TOKEN} />
      <BackToEditorButton onClick={onBack} />
      <Map mapStyle={MAP_STYLE} mapboxAccessToken={MAPBOX_TOKEN} />
      <PlaybackBar simulation={simulation} />
    </DeckGL>
  );
}
