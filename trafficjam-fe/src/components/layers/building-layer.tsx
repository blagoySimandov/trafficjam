import { useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import type { Building } from "../../types";
import { buildingToGeoJSON } from "../../utils";
import {
  BUILDING_SOURCE_ID,
  BUILDING_CIRCLE_LAYER,
} from "../../constants";

interface BuildingLayerProps {
  buildings: Map<string, Building>;
}

export function BuildingLayer({ buildings }: BuildingLayerProps) {
  const geojson = useMemo(() => buildingToGeoJSON(buildings), [buildings]);

  return (
    <Source id={BUILDING_SOURCE_ID} type="geojson" data={geojson}>
      <Layer {...BUILDING_CIRCLE_LAYER} />
    </Source>
  );
}
