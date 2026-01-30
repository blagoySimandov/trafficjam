import type { Network, TrafficNode, TrafficLink, LngLatTuple } from "../types";

const SNAP_THRESHOLD = 50; // meters

function calculateDistance(point1: LngLatTuple, point2: LngLatTuple): number {
  const [lat1, lon1] = point1;
  const [lat2, lon2] = point2;

  const R = 6371e3;
  const gamma1 = (lat1 * Math.PI) / 180;
  const gamma2 = (lat2 * Math.PI) / 180;
  const delta_gamm = ((lat2 - lat1) * Math.PI) / 180;
  const delta_lambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(delta_gamm / 2) * Math.sin(delta_gamm / 2) +
    Math.cos(gamma1) * Math.cos(gamma2) * Math.sin(delta_lambda / 2) * Math.sin(delta_lambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function distanceToLineSegment(
  point: LngLatTuple,
  lineStart: LngLatTuple,
  lineEnd: LngLatTuple
): { distance: number; closestPoint: LngLatTuple; t: number } {
  const [px, py] = [point[1], point[0]];
  const [x1, y1] = [lineStart[1], lineStart[0]];
  const [x2, y2] = [lineEnd[1], lineEnd[0]];

  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  let t = 0;
  if (lenSq !== 0) {
    t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  }

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  const closestPoint: LngLatTuple = [closestY, closestX];

  const distance = calculateDistance(point, closestPoint);

  return { distance, closestPoint, t };
}

export interface SnapResult {
  point: LngLatTuple;
  nodeId?: string;
  linkId?: string;
  isNode: boolean;
  splitPosition?: number; // For splitting links
}

export function findSnapPoint(
  clickPoint: LngLatTuple,
  network: Network | null,
  existingPoints: LngLatTuple[]
): SnapResult | null {
  if (!network) return null;

  // First point must snap to a node
  if (existingPoints.length === 0) {
    let closestNode: TrafficNode | null = null;
    let minDistance = SNAP_THRESHOLD;

    for (const node of network.nodes.values()) {
      const distance = calculateDistance(clickPoint, node.position);
      if (distance < minDistance) {
        minDistance = distance;
        closestNode = node;
      }
    }

    if (closestNode) {
      return {
        point: closestNode.position,
        nodeId: closestNode.id,
        isNode: true,
      };
    }

    return null; // First point must snap to existing node
  }

  // Subsequent points can snap to nodes or edges
  let closestNode: TrafficNode | null = null;
  let minNodeDistance = SNAP_THRESHOLD;

  for (const node of network.nodes.values()) {
    const distance = calculateDistance(clickPoint, node.position);
    if (distance < minNodeDistance) {
      minNodeDistance = distance;
      closestNode = node;
    }
  }

  // Check for closest edge
  let closestLink: TrafficLink | null = null;
  let minEdgeDistance = SNAP_THRESHOLD;
  let closestPointOnEdge: LngLatTuple | null = null;
  let splitT = 0;

  for (const link of network.links.values()) {
    for (let i = 0; i < link.geometry.length - 1; i++) {
      const { distance, closestPoint, t } = distanceToLineSegment(
        clickPoint,
        link.geometry[i],
        link.geometry[i + 1]
      );

      if (distance < minEdgeDistance) {
        minEdgeDistance = distance;
        closestLink = link;
        closestPointOnEdge = closestPoint;
        splitT = (i + t) / (link.geometry.length - 1);
      }
    }
  }

  // Prefer nodes over edges
  if (closestNode && minNodeDistance < minEdgeDistance * 0.5) {
    return {
      point: closestNode.position,
      nodeId: closestNode.id,
      isNode: true,
    };
  }

  if (closestLink && closestPointOnEdge) {
    return {
      point: closestPointOnEdge,
      linkId: closestLink.id,
      isNode: false,
      splitPosition: splitT,
    };
  }

  return null;
}