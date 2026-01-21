import { Polyline, Tooltip, LayerGroup } from "react-leaflet";
import type { Network, TrafficLink } from "../types";
import { ROAD_STYLES, DEFAULT_STYLE } from "../constants";

interface NetworkLayerProps {
  network: Network;
  onLinkClick: (link: TrafficLink) => void;
}

function LinkLayer({
  link,
  onClick,
}: {
  link: TrafficLink;
  onClick: (link: TrafficLink) => void;
}) {
  const style = ROAD_STYLES[link.tags.highway] || DEFAULT_STYLE;
  const lanes = link.tags.lanes || 1;
  const laneMultiplier = 1 + (lanes - 1) * 0.3;
  const weight = style.baseWeight * laneMultiplier;

  return (
    <>
      {style.glow && (
        <Polyline
          positions={link.geometry}
          pathOptions={{
            color: style.color,
            weight: weight + 12,
            opacity: 0.15,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}

      <Polyline
        positions={link.geometry}
        pathOptions={{
          color: style.casingColor,
          weight: weight + 4,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }}
      />

      <Polyline
        positions={link.geometry}
        pathOptions={{
          color: style.color,
          weight,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
        }}
        eventHandlers={{
          click: (e) => {
            e.originalEvent.stopPropagation();
            onClick(link);
          },
        }}
      >
        <Tooltip sticky>
          <TooltipContent link={link} />
        </Tooltip>
      </Polyline>

      {lanes >= 2 && !link.tags.oneway && (
        <Polyline
          positions={link.geometry}
          pathOptions={{
            color: style.casingColor,
            weight: 1,
            opacity: 0.5,
            dashArray: "8, 12",
          }}
        />
      )}
    </>
  );
}

function TooltipContent({ link }: { link: TrafficLink }) {
  return (
    <div className="link-tooltip">
      <strong>{link.tags.name || "Unnamed road"}</strong>
      <div className="link-tooltip-details">
        {link.tags.highway}
        {link.tags.lanes && ` • ${link.tags.lanes} lanes`}
        {link.tags.maxspeed && ` • ${link.tags.maxspeed} km/h`}
        {link.tags.oneway && " • One-way"}
      </div>
    </div>
  );
}

export function NetworkLayer({ network, onLinkClick }: NetworkLayerProps) {
  const links = Array.from(network.links.values());

  return (
    <LayerGroup>
      {links.map((link) => (
        <LinkLayer onClick={onLinkClick} key={link.id} link={link} />
      ))}
    </LayerGroup>
  );
}
