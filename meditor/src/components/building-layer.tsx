import { useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import type { Building } from "../types";
import { buildingToGeoJSON } from "../utils";
import {
  BUILDING_SOURCE_ID,
  BUILDING_CIRCLE_LAYER,
} from "../constants";

interface BuildingLayerProps {
  buildings: Map<string, Building>;
  crs: string;
}

export function BuildingLayer({ buildings, crs }: BuildingLayerProps) {
  const geojson = useMemo(() => buildingToGeoJSON(buildings, crs), [buildings, crs]);

  return (
    <Source id={BUILDING_SOURCE_ID} type="geojson" data={geojson}>
      <Layer {...BUILDING_CIRCLE_LAYER} />
    </Source>
  );
}
