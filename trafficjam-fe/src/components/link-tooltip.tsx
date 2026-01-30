import type { TrafficLink } from "../types";

interface LinkTooltipProps {
  link: TrafficLink;
}

export function LinkTooltip({ link }: LinkTooltipProps) {
  const { tags } = link;

  return (
    <div className="link-tooltip">
      <strong>{tags.name || "Unnamed road"}</strong>
      <div className="link-tooltip-details">
        {tags.highway}
        {tags.lanes && ` • ${tags.lanes} lanes`}
        {tags.maxspeed && ` • ${tags.maxspeed} km/h`}
        {tags.oneway && " • One-way"}
      </div>
    </div>
  );
}
