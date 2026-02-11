import { Source, Layer } from "react-map-gl";
import type { Network } from "../../../../types";
import { useNodeLayerStyle } from "../../hooks/use-node-layer-style";

interface NodeLayerProps {
  network: Network;
  editorMode: boolean;
  draggedNodeId: string | null;
}

export function NodeLayer({
  network,
  editorMode,
  draggedNodeId,
}: NodeLayerProps) {
  const { geojson, layerStyle } = useNodeLayerStyle(network, draggedNodeId);

  if (!editorMode) return null;

  return (
    <Source id="nodes" type="geojson" data={geojson}>
      <Layer {...layerStyle} />
      <Layer {...layerStyle} />
    </Source>
  );
}
