import { Polyline, Tooltip } from "react-leaflet";
import type { TrafficLink } from "../types";
import { ROAD_STYLES, DEFAULT_STYLE } from "../constants";
import { LinkTooltip } from "./link-tooltip";

interface LinkLayerProps {
  link: TrafficLink;
  onClick: (link: TrafficLink) => void;
}

function calculateWeight(baseWeight: number, lanes: number): number {
  const laneMultiplier = 1 + (lanes - 1) * 0.3;
  return baseWeight * laneMultiplier;
}

export function LinkLayer({ link, onClick }: LinkLayerProps) {
  const style = ROAD_STYLES[link.tags.highway] || DEFAULT_STYLE;
  const lanes = link.tags.lanes || 1;
  const weight = calculateWeight(style.baseWeight, lanes);

  const basePathOptions = {
    lineCap: "round" as const,
    lineJoin: "round" as const,
  };

  return (
    <>
      {style.glow && (
        <Polyline
          positions={link.geometry}
          pathOptions={{
            ...basePathOptions,
            color: style.color,
            weight: weight + 12,
            opacity: 0.15,
          }}
        />
      )}

      <Polyline
        positions={link.geometry}
        pathOptions={{
          ...basePathOptions,
          color: style.casingColor,
          weight: weight + 4,
          opacity: 0.9,
        }}
      />

      <Polyline
        positions={link.geometry}
        pathOptions={{
          ...basePathOptions,
          color: style.color,
          weight,
          opacity: 1,
        }}
        eventHandlers={{
          click: (e) => {
            e.originalEvent.stopPropagation();
            onClick(link);
          },
        }}
      >
        <Tooltip sticky>
          <LinkTooltip link={link} />
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
