import type { TrafficLink } from "../../types";
import { MIXED_VALUE } from "./constants";

export function getCommonValue<T>(
  links: TrafficLink[],
  getter: (link: TrafficLink) => T | undefined,
): T | typeof MIXED_VALUE | undefined {
  if (links.length === 0) return undefined;
  const firstValue = getter(links[0]);
  const allSame = links.every((link) => getter(link) === firstValue);
  return allSame ? firstValue : MIXED_VALUE;
}
