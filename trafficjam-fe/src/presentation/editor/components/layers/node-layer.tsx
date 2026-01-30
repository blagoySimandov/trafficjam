import { useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import type { Network } from "../../../../types";
import { nodeToGeoJSON } from "../../../../utils";
import { NODE_CIRCLE_LAYER } from "../../../../constants";

interface NodeLayerProps {
  network: Network;
  editorMode: boolean;
}

export function NodeLayer({ network, editorMode }: NodeLayerProps) {
  const geojson = useMemo(() => nodeToGeoJSON(network), [network]);

  if (!editorMode) return null;

  return (
    <Source id="nodes" type="geojson" data={geojson}>
      <Layer {...NODE_CIRCLE_LAYER} />
    </Source>
  );
}
