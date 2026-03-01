/**
 * Merges a base Mapbox filter with an exclusion filter for specific IDs.
 * Used for "draft/static" rendering to hide items in the static layer
 * while they are being actively manipulated in the draft layer.
 */
export function mergeFilters(
  baseFilter: unknown[] | undefined,
  filterOutIds: string[] | undefined,
): unknown[] | undefined {
  if (!filterOutIds || filterOutIds.length === 0) return baseFilter;

  const idFilter: unknown[] = ["!", ["in", ["get", "id"], ["literal", filterOutIds]]];

  if (!baseFilter) return idFilter;

  if (Array.isArray(baseFilter) && baseFilter[0] === "all") {
    return [...baseFilter, idFilter];
  }

  return ["all", baseFilter, idFilter];
}
