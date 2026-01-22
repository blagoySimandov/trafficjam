import type { BusRoute } from "../types";

interface BusRouteTooltipProps {
  route: BusRoute;
}

export function BusRouteTooltip({ route }: BusRouteTooltipProps) {
  return (
    <div style={{ minWidth: "150px" }}>
      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
        {route.name}
      </div>
      <div>
        <strong>Type:</strong> {route.routeType}
      </div>
      {route.ref && (
        <div>
          <strong>Route:</strong> {route.ref}
        </div>
      )}
      {route.operator && (
        <div>
          <strong>Operator:</strong> {route.operator}
        </div>
      )}
      {route.from && (
        <div>
          <strong>From:</strong> {route.from}
        </div>
      )}
      {route.to && (
        <div>
          <strong>To:</strong> {route.to}
        </div>
      )}
    </div>
  );
}
