import { useCallback } from 'react';
import type { Network, LngLatTuple} from '../../../types';
import { findSnapPoint } from '../../../utils/snap-to-network';

interface UseNodeSnapParams {
    network: Network | null;
    onNetworkChange: (network: Network) => void;
}

export function useNodeSnap({
  network,
  onNetworkChange,
}: UseNodeSnapParams) {
  const snapNodeToNetwork = useCallback(
    (nodeId: string, position: LngLatTuple) => {
      if (!network) return;
      
      // Filter out the dragged node from snap candidates
      const filteredNetwork: Network = {
        ...network,
        nodes: new Map(
          [...network.nodes.entries()].filter(([id]) => id !== nodeId)
        ),
      };
      
      const snapResult = findSnapPoint(position, filteredNetwork, []);
      
      if (snapResult?.isNode && snapResult.nodeId) {
          const targetNodeId = snapResult.nodeId;
          const snappedPosition = snapResult.point;
          
          // Get the current position of the node being snapped (before it's deleted)
          const nodeBeingSnapped = network.nodes.get(nodeId);
          const oldNodePosition: LngLatTuple | undefined = nodeBeingSnapped?.position;

          const updatedLinks = new Map(network.links);
          for (const [linkId, link] of network.links.entries()) {
            let shouldUpdate = false;
            const geometry = [...link.geometry];
            let from = link.from;
            let to = link.to;

            if (link.from === nodeId) {
              from = targetNodeId;
              geometry[0] = snappedPosition;
              shouldUpdate = true;
            }
            if (link.to === nodeId) {
              to = targetNodeId;
              geometry[geometry.length - 1] = snappedPosition;
              shouldUpdate = true;
            }

            if (!shouldUpdate && oldNodePosition) {
              for (let i = 0; i < geometry.length; i++) {
                const [lat, lng] = geometry[i];
                const isOldNodePosition =
                  Math.abs(lat - oldNodePosition[0]) < 0.000001 &&
                  Math.abs(lng - oldNodePosition[1]) < 0.000001;

                if (isOldNodePosition) {
                  geometry[i] = snappedPosition;
                  shouldUpdate = true;
                }
              }
            }

            if (shouldUpdate) {
              updatedLinks.set(linkId, { ...link, from, to, geometry });
            }
          }

          const updatedNodes = new Map(network.nodes);
          updatedNodes.delete(nodeId);

          const targetNode = updatedNodes.get(targetNodeId);
          if (targetNode) {
            let connectionCount = 0;
            for (const link of updatedLinks.values()) {
              if (link.from === targetNodeId || link.to === targetNodeId) {
                connectionCount++;
              }
            }
            updatedNodes.set(targetNodeId, {
              ...targetNode,
              connectionCount: connectionCount,
            });

            onNetworkChange({
              ...network,
              nodes: updatedNodes,
              links: updatedLinks,
            });
          }
        }
    },
    [network, onNetworkChange]
  );
  
  return { snapNodeToNetwork };
}