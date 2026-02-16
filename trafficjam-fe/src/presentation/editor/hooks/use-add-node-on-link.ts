import { useCallback } from "react";
import type { Network, TrafficLink, TrafficNode } from "../../../types";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import lineSplit from "@turf/line-split";
import { point, lineString } from "@turf/helpers";
import type { Feature, LineString, Point, FeatureCollection } from "geojson";

interface UseAddNodeOnLinkParams {
  network: Network | null;
  setNetwork: (n: Network | null) => void;
  pushToUndoStack: (n: Network) => void;
  onStatusChange: (s: string) => void;
  editorMode: boolean;
  onLinkClick?: (link: TrafficLink) => void;
}

function createNodeAtMidpoint(
  link: TrafficLink,
  baseNow: number,
  newNodes: Map<string, TrafficNode>,
  newLinks: Map<string, TrafficLink>
) {
  const geom = link.geometry;
  const midIdx = Math.floor(geom.length / 2);
  const mid = geom[midIdx];
  const newNodeId = `node-${baseNow}-${Math.random().toString(36).slice(2, 7)}`;
  const newNode = {
    id: newNodeId,
    position: mid,
    connectionCount: 2,
  };
  newNodes.set(newNodeId, newNode);

  newLinks.delete(link.id);
  const left = geom.slice(0, midIdx + 1);
  left.push(mid);
  const right = [mid, ...geom.slice(midIdx + 1)];

  const linkAId = `edge-${baseNow}-${Math.random().toString(36).slice(2, 7)}`;
  const linkBId = `edge-${baseNow + 1}-${Math.random().toString(36).slice(2, 7)}`;

  const newLinkA: TrafficLink = {
    ...link,
    id: linkAId,
    from: link.from,
    to: newNodeId,
    geometry: left,
  };
  const newLinkB: TrafficLink = {
    ...link,
    id: linkBId,
    from: newNodeId,
    to: link.to,
    geometry: right,
  };

  newLinks.set(linkAId, newLinkA);
  newLinks.set(linkBId, newLinkB);
}

export function useAddNodeOnLink({
  network,
  setNetwork,
  pushToUndoStack,
  onStatusChange,
  editorMode,
  onLinkClick,
}: UseAddNodeOnLinkParams) {
  return useCallback(
    (link: TrafficLink, coords?: { lng: number; lat: number }) => {
      if (editorMode) {
        if (!network) {
          onStatusChange("No network loaded");
          return;
        }

        pushToUndoStack(network);

        const newLinks = new Map(network.links);
        const newNodes = new Map(network.nodes);

        const baseNow = Date.now();

        if (coords) {
          try {
            const coordsArr = link.geometry.map(([lat, lng]) => [lng, lat]);
            const line = lineString(coordsArr);
            const pt = point([coords.lng, coords.lat]);
            const snapped = nearestPointOnLine(line, pt) as Feature<Point>;
            const split = lineSplit(line, snapped) as FeatureCollection<LineString>;

            if (split && split.features && split.features.length >= 2) {
              const leftCoords = split.features[0].geometry.coordinates.map(
                (coord) => [coord[1], coord[0]] as [number, number],
              );
              const rightCoords = split.features[1].geometry.coordinates.map(
                (coord) => [coord[1], coord[0]] as [number, number],
              );

              const snappedCoord = snapped.geometry.coordinates as [number, number];
              const newNodeId = `node-${baseNow}-${Math.random().toString(36).slice(2, 7)}`;

              const newNode = {
                id: newNodeId,
                position: [snappedCoord[1], snappedCoord[0]] as [number, number],
                connectionCount: 2,
              };

              newNodes.set(newNodeId, newNode);

              newLinks.delete(link.id);

              const linkAId = `edge-${baseNow}-${Math.random().toString(36).slice(2, 7)}`;
              const linkBId = `edge-${baseNow + 1}-${Math.random().toString(36).slice(2, 7)}`;

              const newLinkA: TrafficLink = {
                ...link,
                id: linkAId,
                from: link.from,
                to: newNodeId,
                geometry: leftCoords,
              };

              const newLinkB: TrafficLink = {
                ...link,
                id: linkBId,
                from: newNodeId,
                to: link.to,
                geometry: rightCoords,
              };

              newLinks.set(linkAId, newLinkA);
              newLinks.set(linkBId, newLinkB);

              // update endpoint connection counts
              const fromNode = newNodes.get(link.from);
              if (fromNode) {
                newNodes.set(link.from, {
                  ...fromNode,
                  connectionCount: (fromNode.connectionCount || 0) + 1,
                });
              }
              const toNode = newNodes.get(link.to);
              if (toNode) {
                newNodes.set(link.to, {
                  ...toNode,
                  connectionCount: (toNode.connectionCount || 0) + 1,
                });
              }
            }
          } catch (err) {
            console.error("Turf split failed", err);
          }
        } else {
          createNodeAtMidpoint(link, baseNow, newNodes, newLinks);
        }

        setNetwork({
          nodes: newNodes,
          links: newLinks,
          transportRoutes: network.transportRoutes
            ? new Map(network.transportRoutes)
            : undefined,
          buildings: network.buildings ? new Map(network.buildings) : undefined,
        });

        onStatusChange(`Added node on ${link.id}`);
      } else {
        if (onLinkClick) onLinkClick(link as TrafficLink);
      }
    },
    [editorMode, network, pushToUndoStack, setNetwork, onStatusChange, onLinkClick]
  );
}
