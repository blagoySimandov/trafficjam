import { Source, Layer } from "react-map-gl";
import type { Network } from "../../../../types";
import { useNodeLayerStyle } from "../../hooks/use-node-layer-style";

interface NodeLayerProps {
  network: Network;
  editorMode: boolean;
  draggedNodeId: string | null;
  tempNodeId?: string | null;
  idPrefix?: string;
}

export function NodeLayer({
  network,
  editorMode,
  draggedNodeId,
  tempNodeId,
  idPrefix = "static",
}: NodeLayerProps) {
  const { geojson, layerStyle } = useNodeLayerStyle(
    network,
    draggedNodeId,
    tempNodeId,
  );

  if (!editorMode) return null;

  const sourceId = `${idPrefix}-nodes`;

  return (
    <Source id={sourceId} type="geojson" data={geojson}>
      <Layer
        {...layerStyle}
        id={`${idPrefix}-${layerStyle.id}`}
      />
    </Source>
  );
}
