import { useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import type { LayerProps } from "react-map-gl";
import type { Network } from "../../../../types";
import { nodeToGeoJSON } from "../../../../utils";
import { NODE_CIRCLE_LAYER } from "../../../../constants";

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
  const geojson = useMemo(() => nodeToGeoJSON(network), [network]);

  // Dynamically adjust layer style based on draggedNodeId
  const layerStyle: LayerProps = useMemo(() => {
    if (!draggedNodeId) {
      return NODE_CIRCLE_LAYER;
    }

    //Essentially, if the node id is of the node being dragged, change its style
    //multiply radius by 2 and change color to red
    //interpolate makes nodes with more connections larger (twice for both colors)
    return {
      ...NODE_CIRCLE_LAYER,
      paint: {
        ...NODE_CIRCLE_LAYER.paint,
        "circle-radius": [
          "case",
          ["==", ["get", "id"], draggedNodeId],
          [
            "*",
            2.0,
            [
              "interpolate",
              ["linear"],
              ["get", "connectionCount"],
              1,
              4,
              2,
              5,
              3,
              6,
              4,
              7,
            ],
          ],
          [
            "interpolate",
            ["linear"],
            ["get", "connectionCount"],
            1,
            4,
            2,
            5,
            3,
            6,
            4,
            7,
          ],
        ],
        "circle-color": [
          "case",
          ["==", ["get", "id"], draggedNodeId],
          "#ef4444", // red color for dragged node
          "#3b82f6", // default blue
        ],
      },
    } as LayerProps;
  }, [draggedNodeId]);

  if (!editorMode) return null;

  return (
    <Source id="nodes" type="geojson" data={geojson}>
      <Layer {...layerStyle} />
    </Source>
  );
}
