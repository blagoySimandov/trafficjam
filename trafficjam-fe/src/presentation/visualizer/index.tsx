import { useQuery } from "@tanstack/react-query";
import { DeckGL, TripsLayer, ScatterplotLayer } from "deck.gl";
import { Map } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "../../constants/map";
import { loadTrips, getVehiclePositions } from "../../event-processing";
import type { Trip } from "../../event-processing";
import { useSimulationTime } from "./hooks/use-simulation-time";
import { INITIAL_STATE_CORK, DARK_MAP_STYLE } from "./constants";
import { BackToEditorButton } from "./components/back-button";

interface VisualizerProps {
  onBack: () => void;
}

function useLayers(trips: Trip[], time: number) {
  return [
    new TripsLayer({
      id: "trails",
      data: trips,
      getPath: (d: Trip) => d.path,
      getTimestamps: (d: Trip) => d.timestamps,
      getColor: [253, 128, 93],
      widthMinPixels: 2,
      trailLength: 300,
      currentTime: time,
    }),
    new ScatterplotLayer({
      id: "cars",
      data: getVehiclePositions(trips, time),
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
  const time = useSimulationTime(trips);
  const layers = useLayers(trips, time);

  return (
    <DeckGL initialViewState={INITIAL_STATE_CORK} controller layers={layers}>
      <Map mapStyle={DARK_MAP_STYLE} mapboxAccessToken={MAPBOX_TOKEN} />
      <BackToEditorButton onClick={onBack} />
    </DeckGL>
  );
}
