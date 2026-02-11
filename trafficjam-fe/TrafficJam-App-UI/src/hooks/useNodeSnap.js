import { useCallback } from 'react';
import { calculateHaversineDistance } from '../utils/haversine';

const SNAP_THRESHOLD_METERS = 10; // Snap within 10 meters (increased for visibility)

/**
 * Hook for handling node snapping and merging
 * Automatically merges nodes when dragged close together
 */
export function useNodeSnap({ network, onNetworkChange }) {

  const snapNodeToNetwork = useCallback((nodeId, position) => {
    if (!network) return false;

    // Find closest node within snap threshold
    let closestNodeId = null;
    let closestDistance = Infinity;

    for (const [otherId, otherNode] of network.nodes) {
      if (otherId === nodeId) continue;

      const distance = calculateHaversineDistance(
        position,
        otherNode.position
      );

      if (distance < SNAP_THRESHOLD_METERS && distance < closestDistance) {
        closestDistance = distance;
        closestNodeId = otherId;
      }
    }

    // If found a snap target, merge the nodes
    if (closestNodeId) {
      const newNetwork = {
        nodes: new Map(network.nodes),
        links: new Map(network.links),
      };

      const targetNode = newNetwork.nodes.get(closestNodeId);
      if (!targetNode) return;

      // Delete the dragged node
      newNetwork.nodes.delete(nodeId);

      // Redirect all links from dragged node to target node
      for (const [linkId, link] of newNetwork.links) {
        let updated = false;
        const newLink = { ...link };

        if (link.from === nodeId) {
          newLink.from = closestNodeId;
          newLink.geometry = [targetNode.position, ...link.geometry.slice(1)];
          updated = true;
        }

        if (link.to === nodeId) {
          newLink.to = closestNodeId;
          newLink.geometry = [...link.geometry.slice(0, -1), targetNode.position];
          updated = true;
        }

        if (updated) {
          newNetwork.links.set(linkId, newLink);
        }
      }

      // Recalculate connection count for target node
      let connectionCount = 0;
      for (const link of newNetwork.links.values()) {
        if (link.from === closestNodeId || link.to === closestNodeId) {
          connectionCount++;
        }
      }

      newNetwork.nodes.set(closestNodeId, {
        ...targetNode,
        connectionCount
      });

      onNetworkChange(newNetwork);
      return true;
    }

    return false;
  }, [network, onNetworkChange]);

  return { snapNodeToNetwork };
}
