import {
  BUILDING_SOURCE_ID,
  BUILDING_FILL_LAYER,
  BUILDING_OUTLINE_LAYER,
  BUILDING_HOTSPOT_FILL_LAYER,
  BUILDING_HOTSPOT_OUTLINE_LAYER,
} from "@/constants";
import type { Building } from "@/types";
import { buildingToGeoJSON } from "@/utils";
import { useMemo } from "react";
import { Source, Layer } from "react-map-gl";

interface BuildingLayerProps {
  buildings: Map<string, Building>;
}

export function BuildingLayer({ buildings }: BuildingLayerProps) {
  const geojson = useMemo(() => buildingToGeoJSON(buildings), [buildings]);

  return (
    <Source id={BUILDING_SOURCE_ID} type="geojson" data={geojson}>
      <Layer {...BUILDING_FILL_LAYER} />
      <Layer {...BUILDING_OUTLINE_LAYER} />
      <Layer {...BUILDING_HOTSPOT_FILL_LAYER} />
      <Layer {...BUILDING_HOTSPOT_OUTLINE_LAYER} />
    </Source>
  );
}
