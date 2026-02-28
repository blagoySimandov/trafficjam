import { useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import type { Network } from "../../../../types";
import { useNodeLayerStyle } from "../../hooks/use-node-layer-style";

interface NodeLayerProps {
  network: Network;
  editorMode: boolean;
  draggedNodeId: string | null;
  tempNodeId?: string | null;
  idPrefix?: string;
  filterIds?: string[];
}

function mergeFilters(baseFilter: any[] | undefined, filterOutIds: string[] | undefined): any[] | undefined {
  if (!filterOutIds || filterOutIds.length === 0) return baseFilter;
  
  const idFilter = ["!", ["in", ["get", "id"], ["literal", filterOutIds]]];
  
  if (!baseFilter) return idFilter;
  
  if (Array.isArray(baseFilter) && baseFilter[0] === "all") {
    return [...baseFilter, idFilter];
  }
  
  return ["all", baseFilter, idFilter];
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
    const filter = mergeFilters(layerStyle.filter as any[], filterIds);
    return {
      ...layerStyle,
      id: `${idPrefix}-${layerStyle.id}`,
      ...(filter ? { filter } : {})
    };
  }, [layerStyle, idPrefix, filterIds]);

  if (!editorMode) return null;

  const sourceId = `${idPrefix}-nodes`;

  return (
    <Source id={sourceId} type="geojson" data={geojson}>
      <Layer {...layerProps} />
    </Source>
  );
}
