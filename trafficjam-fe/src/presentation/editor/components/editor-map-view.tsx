import { useState, useRef, useCallback, useEffect } from "react";
import Map from "react-map-gl";
import type { MapRef, MapMouseEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Network, TrafficLink } from "../../../types";
import { useUndoStack } from "../hooks/use-undo-stack";
import { useAddNodeOnLink } from "../hooks/use-add-node-on-link";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_STYLE,
  MAPBOX_TOKEN,
  INTERACTIVE_LAYER_IDS,
  MIN_EDIT_ZOOM,
} from "../../../constants";
import { useOSMImport } from "../../../hooks/use-osm-import";
import { useMapInteractions } from "../../../hooks/use-map-interactions";
import { useNetworkExport } from "../hooks/use-network-export";
import { useNodeDrag } from "../hooks/use-node-drag";
import { useNodeAdd } from "../hooks/use-node-add";
import { EditorControls } from "./editor-controls";
import { NetworkLayer } from "../../../components/layers/network-layer";
import { TransportLayer } from "../../../components/layers/transport-layer";
import { BuildingLayer } from "../../../components/layers/building-layer";
import { NodeLayer } from "./layers/node-layer";
import { CombinedTooltip } from "../../../components/combined-tooltip";

// Alias the native Map constructor to avoid conflict with react-map-gl Map component
const NativeMap = globalThis.Map;

interface EditorMapViewProps {
  onStatusChange: (status: string) => void;
  onLinkClick: (link: TrafficLink) => void;
  onRegisterBulkLinkUpdater: (updater: (links: TrafficLink[]) => void) => void;
  selectedLinkIds: string[];
  onNetworkChange?: (network: Network | null) => void;
}

export function EditorMapView({
  onStatusChange,
  onLinkClick,
  onRegisterBulkLinkUpdater,
  selectedLinkIds,
  onNetworkChange,
}: EditorMapViewProps) {
  const [network, setNetwork] = useState<Network | null>(null);
  const [showBuildings, setShowBuildings] = useState(true);
  const [editorMode, setEditorMode] = useState(false);
  const mapRef = useRef<MapRef | null>(null);

  // Notify parent when network changes
  useEffect(() => {
    onNetworkChange?.(network);
  }, [network, onNetworkChange]);

  const { pushToUndoStack, undo, canUndo, clearUndoStack } = useUndoStack();
  const { exportNetwork } = useNetworkExport(network, { onStatusChange });

  const { loading, importData, clear } = useOSMImport(mapRef, {
    onStatusChange,
    onNetworkChange: setNetwork,
  });

  const updateMultipleLinksInNetwork = useCallback(
    (updatedLinksList: TrafficLink[]) => {
      if (!network || updatedLinksList.length === 0) return;

      const updatedLinks = new NativeMap(network.links);
      updatedLinksList.forEach((updatedLink) => {
        updatedLinks.set(updatedLink.id, updatedLink);
      });

      const updatedNetwork = {
        ...network,
        links: updatedLinks,
      };

      pushToUndoStack(network);
      setNetwork(updatedNetwork);

      const count = updatedLinksList.length;
      if (count === 1) {
        onStatusChange(
          `Updated link: ${updatedLinksList[0].tags.name || updatedLinksList[0].tags.highway}`,
        );
      } else {
        onStatusChange(`Updated ${count} links`);
      }
    },
    [network, pushToUndoStack, onStatusChange],
  );

  useEffect(() => {
    onRegisterBulkLinkUpdater(updateMultipleLinksInNetwork);
  }, [updateMultipleLinksInNetwork, onRegisterBulkLinkUpdater]);

  const handleClear = useCallback(() => {
    clear();
    clearUndoStack();
  }, [clear, clearUndoStack]);

  const handleLinkClickLocal = useAddNodeOnLink({
    network,
    setNetwork,
    pushToUndoStack,
    onStatusChange,
    editorMode,
    onLinkClick,
  });

  const { hoverInfo, onClick, onMouseMove, onMouseLeave } = useMapInteractions({
    network,
    mapRef,
    onLinkClick: handleLinkClickLocal,
    editorMode,
  });

  const {
    isDragging,
    displayNetwork: dragDisplayNetwork,
    draggedNodeId,
    onMouseDown: nodeDragMouseDown,
    onMouseMove: nodeDragMouseMove,
    onMouseUp: nodeDragMouseUp,
  } = useNodeDrag({
    network,
    mapRef,
    editorMode,
    onNetworkChange: setNetwork,
    onBeforeChange: pushToUndoStack,
  });

  const {
    isAddingNode,
    displayNetwork: addDisplayNetwork,
    tempNodeId,
    onMouseDown: nodeAddMouseDown,
    onMouseMove: nodeAddMouseMove,
    onMouseUp: nodeAddMouseUp,
  } = useNodeAdd({
    network,
    mapRef,
    editorMode,
    minZoom: MIN_EDIT_ZOOM,
    onNetworkChange: setNetwork,
    onBeforeChange: pushToUndoStack,
  });

  // Merge display networks - prioritize addDisplayNetwork if adding, otherwise use dragDisplayNetwork
  const displayNetwork = isAddingNode ? addDisplayNetwork : dragDisplayNetwork;

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const previousNetwork = undo();
    if (previousNetwork) {
      setNetwork(previousNetwork);
      onStatusChange("Undo");
    }
  }, [canUndo, undo, onStatusChange]);

  // Keyboard shortcut for undo (Cmd+Z on Mac, Ctrl+Z on Windows/Linux)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo]);

  const handleMapRef = useCallback((ref: MapRef | null) => {
    mapRef.current = ref;
  }, []);

  const toggleBuildings = useCallback(() => {
    setShowBuildings((prev) => !prev);
  }, [setShowBuildings]);

  const toggleEditorMode = useCallback(() => {
    setEditorMode((prev) => !prev);
  }, [setEditorMode]);

  const handleMapClick = useCallback(
    (event: MapMouseEvent) => {
      if (onClick(event)) return;
    },
    [onClick],
  );

  const handleMapMouseDown = useCallback(
    (event: MapMouseEvent) => {
      if (nodeDragMouseDown(event)) return;
      if (nodeAddMouseDown(event)) return;
    },
    [nodeDragMouseDown, nodeAddMouseDown],
  );

  const handleMapMouseUp = useCallback(
    (event: MapMouseEvent) => {
      if (nodeDragMouseUp()) return;
      if (nodeAddMouseUp(event)) return;
    },
    [nodeDragMouseUp, nodeAddMouseUp],
  );

  const handleMapMouseMove = useCallback(
    (event: MapMouseEvent) => {
      if (nodeDragMouseMove(event)) return;
      if (nodeAddMouseMove(event)) return;
      onMouseMove(event);
    },
    [nodeDragMouseMove, nodeAddMouseMove, onMouseMove],
  );

  return (
    <Map
      ref={handleMapRef}
      initialViewState={{
        longitude: DEFAULT_CENTER[0],
        latitude: DEFAULT_CENTER[1],
        zoom: DEFAULT_ZOOM,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      mapboxAccessToken={MAPBOX_TOKEN}
      interactiveLayerIds={network ? INTERACTIVE_LAYER_IDS : []}
      dragPan={!draggedNodeId && !isAddingNode}
      onClick={handleMapClick}
      onMouseDown={handleMapMouseDown}
      onMouseUp={handleMapMouseUp}
      onMouseMove={handleMapMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <EditorControls
        onImport={importData}
        onClear={handleClear}
        onExport={exportNetwork}
        loading={loading}
        showBuildings={showBuildings}
        onToggleBuildings={toggleBuildings}
        editorMode={editorMode}
        onToggleEditorMode={toggleEditorMode}
        onUndo={handleUndo}
        canUndo={canUndo}
      />
      {displayNetwork && (
        <NetworkLayer
          network={displayNetwork}
          hoverInfo={null}
          selectedLinkIds={selectedLinkIds}
        />
      )}
      {displayNetwork && (
        <NodeLayer
          network={displayNetwork}
          editorMode={editorMode}
          draggedNodeId={draggedNodeId}
          tempNodeId={isAddingNode ? tempNodeId : null}
        />
      )}
      {displayNetwork?.transportRoutes &&
        displayNetwork.transportRoutes.size > 0 && (
          <TransportLayer
            routes={displayNetwork.transportRoutes}
            hoverInfo={null}
          />
        )}
      {showBuildings &&
        displayNetwork?.buildings &&
        displayNetwork.buildings.size > 0 && (
          <BuildingLayer buildings={displayNetwork.buildings} />
        )}
      {hoverInfo && !editorMode && !isDragging && (
        <CombinedTooltip
          link={hoverInfo.link}
          routes={hoverInfo.routes}
          building={hoverInfo.building}
          longitude={hoverInfo.longitude}
          latitude={hoverInfo.latitude}
        />
      )}
    </Map>
  );
}
