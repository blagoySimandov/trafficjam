import { useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import type { TransportRoute } from "../types";
import { transportRoutesToGeoJSON } from "../utils";
import { TRANSPORT_SOURCE_ID, TRANSPORT_LAYERS } from "../constants";

interface TransportLayerProps {
  routes: Map<string, TransportRoute>;
  hoverInfo: null;
}

export function TransportLayer({ routes }: TransportLayerProps) {
  const geojson = useMemo(() => transportRoutesToGeoJSON(routes), [routes]);

  return (
    <Source id={TRANSPORT_SOURCE_ID} type="geojson" data={geojson}>
      <Layer {...TRANSPORT_LAYERS.SUBWAY} />
      <Layer {...TRANSPORT_LAYERS.BUS} />
      <Layer {...TRANSPORT_LAYERS.TRAM} />
      <Layer {...TRANSPORT_LAYERS.TRAIN} />
      <Layer {...TRANSPORT_LAYERS.LIGHT_RAIL} />
    </Source>
  );
}
