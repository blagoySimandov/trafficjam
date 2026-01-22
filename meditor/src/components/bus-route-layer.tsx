import { Polyline, Tooltip } from "react-leaflet";
import type { BusRoute } from "../types";
import { BusRouteTooltip } from "./bus-route-tooltip";

interface BusRouteLayerProps {
  route: BusRoute;
  onClick: (route: BusRoute) => void;
}

function getRouteStyle(routeType: string) {
  switch (routeType) {
    case "subway":
    case "train":
      return {
        color: "#0066CC",
        weight: 3,
        opacity: 0.8,
        dashArray: undefined,
      };
    case "tram":
      return {
        color: "#FF6600",
        weight: 2.5,
        opacity: 0.75,
        dashArray: "10, 5",
      };
    case "bus":
    default:
      return {
        color: "#FF0000",
        weight: 2,
        opacity: 0.7,
        dashArray: "5, 5",
      };
  }
}

export function BusRouteLayer({ route, onClick }: BusRouteLayerProps) {
  const style = getRouteStyle(route.routeType);

  return (
    <Polyline
      positions={route.geometry}
      pathOptions={{
        ...style,
        lineCap: "butt",
        lineJoin: "round",
      }}
      eventHandlers={{
        click: (e) => {
          e.originalEvent.stopPropagation();
          onClick(route);
        },
      }}
    >
      <Tooltip sticky>
        <BusRouteTooltip route={route} />
      </Tooltip>
    </Polyline>
  );
}
