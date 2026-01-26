import { useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import type { LayerProps } from "react-map-gl";
import type { FeatureCollection, Feature, Polygon } from "geojson";
import type { BuildingPreset } from "../hooks/use-editor-mode";
import { BUILDING_COLORS, DEFAULT_BUILDING_COLOR } from "../constants";



interface BuildingPresetLayerProps {
  presets: Map<string, BuildingPreset>;
}

interface PresetFeatureProperties {
  id: string;
  type: string;
  name?: string;
  color: string;
}

// const PRESET_COLORS: Record<string, string> = {
//   park: "#22c55e",
//   roundabout: "#94a3b8",
//   parking: "#3b82f6",
//   mall: "#f59e0b",
//   building: "#64748b",
// };

function createRectangle(
  center: [number, number],
  width: number,
  height: number
): number[][] {
  // Convert meters to degrees (approximate)
  const dLon = width / (111320 * Math.cos(center[0] * Math.PI / 180)) / 2;
  const dLat = height / 110540 / 2;

  const [lat, lon] = center;

  return [
    [lon - dLon, lat - dLat], // SW
    [lon + dLon, lat - dLat], // SE
    [lon + dLon, lat + dLat], // NE
    [lon - dLon, lat + dLat], // NW
    [lon - dLon, lat - dLat], // Close
  ];
}

function presetsToGeoJSON(
  presets: Map<string, BuildingPreset>
): FeatureCollection<Polygon, PresetFeatureProperties> {
  const features: Feature<Polygon, PresetFeatureProperties>[] = [];

  for (const preset of presets.values()) {
    const color = BUILDING_COLORS[preset.type] || DEFAULT_BUILDING_COLOR;
    const coords = createRectangle(preset.position, preset.width, preset.height);

    features.push({
      type: "Feature",
      id: preset.id,
      properties: {
        id: preset.id,
        type: preset.type,
        name: preset.name,
        color,
      },
      geometry: {
        type: "Polygon",
        coordinates: [coords],
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

const presetFillLayer: LayerProps = {
  id: "building-preset-fill",
  type: "fill",
  paint: {
    "fill-color": ["get", "color"],
    "fill-opacity": 0.6,
  },
};

const presetOutlineLayer: LayerProps = {
  id: "building-preset-outline",
  type: "line",
  paint: {
    "line-color": ["get", "color"],
    "line-width": 3,
    "line-opacity": 1,
  },
};

export function BuildingPresetLayer({ presets }: BuildingPresetLayerProps) {
  const geojson = useMemo(() => presetsToGeoJSON(presets), [presets]);

  if (presets.size === 0) return null;

  return (
    <Source id="building-presets" type="geojson" data={geojson}>
      <Layer {...presetFillLayer} />
      <Layer {...presetOutlineLayer} />
    </Source>
  );
}