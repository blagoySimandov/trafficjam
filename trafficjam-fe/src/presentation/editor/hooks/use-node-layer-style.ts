import { useMemo } from "react";
import type { LayerProps } from "react-map-gl";
import type { Network } from "../../../types";
import { nodeToGeoJSON } from "../../../utils";
import { NODE_CIRCLE_LAYER, COLORS } from "../../../constants";

export function useNodeLayerStyle(network: Network, draggedNodeId: string | null) {
  const geojson = useMemo(() => nodeToGeoJSON(network), [network]);

  const layerStyle: LayerProps = useMemo(() => {
    if (!draggedNodeId) return NODE_CIRCLE_LAYER;

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
          COLORS.nodeDragged,
          COLORS.nodeDefault,
        ],
      },
    } as LayerProps;
  }, [draggedNodeId]);

  return { geojson, layerStyle };
}
