import { Source, Layer } from "react-map-gl";
import type { Network } from "../../../../types";
import { useNodeLayerStyle } from "../../hooks/use-node-layer-style";

interface NodeLayerProps {
  network: Network;
  editorMode: boolean;
  draggedNodeId: string | null;
  tempNodeId?: string | null;
}

export function NodeLayer({
  network,
  editorMode,
  draggedNodeId,
  tempNodeId,
}: NodeLayerProps) {
  const { geojson, layerStyle } = useNodeLayerStyle(
    network,
    draggedNodeId,
    tempNodeId,
  );

  if (!editorMode) return null;

  return (
    <Source id="nodes" type="geojson" data={geojson}>
      <Layer {...layerStyle} />
      <Layer {...layerStyle} />
    </Source>
  );
}
