import { DeckGL, TripsLayer, ScatterplotLayer, PathLayer } from "deck.gl";
import { Map } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "../../constants/map";
import { getVehiclePositions } from "../../event-processing";
import type { Trip } from "../../event-processing";
import {
  useSimulationTime,
  type SimulationTimeState,
} from "./hooks/use-simulation-time";
import { INITIAL_STATE_CORK, DARK_MAP_STYLE } from "./constants";
import { BackToEditorButton } from "./components/back-button";
import { PlaybackBar } from "./components/playback-bar";
import { VisualizerToolbar } from "./components/visualizer-toolbar";
import { AnalyticsPanel } from "./components/analytics-panel";
import { useLiveSimulation } from "../../hooks/use-live-simulation";
import { useLinkVolumes } from "../../hooks";
import type { LinkVolumeParsed } from "../../hooks/use-link-volumes";
import { useState } from "react";

interface VisualizerProps {
  scenarioId: string;
  runId: string;
  onBack: () => void;
}

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

function useStaticLayers(show: boolean, linkVolume?: LinkVolumeParsed[]) {
  if (!show || !linkVolume?.length) return [];

  const maxVol = Math.max(...linkVolume.map((d) => d.vol_car));

  const getColor = (vol: number) => {
    const normalized = Math.min(vol / maxVol, 1);

    if (normalized < 0.25) {
      const t = normalized / 0.25;
      return [0, 128 + t * 127, 255, 180];
    } else if (normalized < 0.5) {
      const t = (normalized - 0.25) / 0.25;
      return [t * 255, 255, 255 - t * 255, 180];
    } else if (normalized < 0.75) {
      const t = (normalized - 0.5) / 0.25;
      return [255, 255 - t * 80, 0, 180];
    } else {
      const t = (normalized - 0.75) / 0.25;
      return [255, 175 - t * 175, 0, 180];
    }
  };

  return [
    new PathLayer<LinkVolumeParsed>({
      id: "link-volume",
      data: linkVolume,
      pickable: true,
      rounded: true,
      capRounded: true,
      getPath: (d) => d.coordinates,
      getWidth: (d) => Math.max(1, (d.vol_car / maxVol) * 15),
      widthUnits: "pixels",
      getColor: (d) => getColor(d.vol_car) as [number, number, number, number],
    }),
  ];
}

export function Visualizer({ scenarioId, runId, onBack }: VisualizerProps) {
  const [showLinkVolume, setShowLinkVolume] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const { trips: liveTrips } = useLiveSimulation(scenarioId, runId);
  const simulation = useSimulationTime(liveTrips);
  const { data: linkVolume } = useLinkVolumes(scenarioId, runId);

  const staticLayers = useStaticLayers(showLinkVolume, linkVolume);
  const layers = [...staticLayers, ...useLayers(liveTrips, simulation)];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <DeckGL initialViewState={INITIAL_STATE_CORK} controller layers={layers}>
        <Map mapStyle={DARK_MAP_STYLE} mapboxAccessToken={MAPBOX_TOKEN} />
      </DeckGL>
      <BackToEditorButton onClick={onBack} />
      <VisualizerToolbar
        showLinkVolume={showLinkVolume}
        onToggleLinkVolume={() => setShowLinkVolume((v) => !v)}
        showAnalytics={showAnalytics}
        onToggleAnalytics={() => setShowAnalytics((v) => !v)}
      />
      <PlaybackBar simulation={simulation} />
      <AnalyticsPanel
        scenarioId={scenarioId}
        runId={runId}
        open={showAnalytics}
      />
    </div>
  );
}
