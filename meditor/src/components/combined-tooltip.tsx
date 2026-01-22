import { Popup } from "react-map-gl";
import type { TrafficLink, TransportRoute } from "../types";

interface CombinedTooltipProps {
  link?: TrafficLink;
  routes?: TransportRoute[];
  longitude: number;
  latitude: number;
}

export function CombinedTooltip({
  link,
  routes,
  longitude,
  latitude,
}: CombinedTooltipProps) {
  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      closeButton={false}
      closeOnClick={false}
      anchor="bottom"
      offset={10}
    >
      <div style={{ padding: "8px", minWidth: "150px" }}>
        {link && (
          <div style={{ marginBottom: routes && routes.length > 0 ? "8px" : "0" }}>
            <strong style={{ fontSize: "12px" }}>
              {link.tags.name || link.tags.highway}
            </strong>
            <div style={{ fontSize: "11px", color: "#666" }}>
              Type: {link.tags.highway}
              {link.tags.lanes && ` • Lanes: ${link.tags.lanes}`}
              {link.tags.maxspeed && ` • Speed: ${link.tags.maxspeed}`}
            </div>
          </div>
        )}
        {routes && routes.length > 0 && (
          <div>
            <strong style={{ fontSize: "11px", color: "#444" }}>
              Transport Lines:
            </strong>
            {routes.map((route, idx) => (
              <div
                key={route.id}
                style={{
                  fontSize: "11px",
                  marginTop: "4px",
                  paddingLeft: "4px",
                  borderLeft: `3px solid ${route.tags.colour || "#666"}`,
                }}
              >
                <strong>{route.tags.route.toUpperCase()}</strong>
                {route.tags.ref && ` ${route.tags.ref}`}
                {route.tags.name && (
                  <div style={{ fontSize: "10px", color: "#666" }}>
                    {route.tags.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Popup>
  );
}
