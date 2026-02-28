import { useMemo } from "react";
import { Source, Layer, type LayerProps } from "react-map-gl";
import type { Network } from "../../../../types";
import { useNodeLayerStyle } from "../../hooks/use-node-layer-style";
import { mergeFilters } from "../../../../utils";

interface NodeLayerProps {
  network: Network;
  editorMode: boolean;
  draggedNodeId: string | null;
  tempNodeId?: string | null;
  idPrefix?: string;
  filterIds?: string[];
}

export function NodeLayer({
  network,
  editorMode,
  draggedNodeId,
  tempNodeId,
  idPrefix = "static",
  filterIds,
}: NodeLayerProps) {
  const { geojson, layerStyle } = useNodeLayerStyle(
    network,
    draggedNodeId,
    tempNodeId,
  );

  const layerProps = useMemo(() => {
    const filter = mergeFilters(layerStyle.filter as unknown[], filterIds);
    return {
      ...layerStyle,
      id: `${idPrefix}-${layerStyle.id}`,
      ...(filter ? { filter } : {}),
    } as LayerProps;
  }, [layerStyle, idPrefix, filterIds]);

  if (!editorMode) return null;

  const sourceId = `${idPrefix}-nodes`;

  return (
    <Source id={sourceId} type="geojson" data={geojson}>
      <Layer {...layerProps} />
    </Source>
  );
}
