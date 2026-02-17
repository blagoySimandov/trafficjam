import { useState, useRef, useCallback, useEffect } from "react";
import Map from "react-map-gl";
import type { MapRef, MapMouseEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Network, TrafficLink } from "../../../types";
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

interface EditorMapViewProps {
  network: Network | null;
  onNetworkChange: (network: Network) => void;
  onNetworkSave: (network: Network, message: string) => void;
  onStatusChange: (status: string) => void;
  onLinkClick: (link: TrafficLink) => void;
  onUndo: () => void;
  onClear: () => void;
  canUndo: boolean;
  selectedLinkId: string | null;
}

export function EditorMapView({
  network,
  onStatusChange,
  onLinkClick,
  onNetworkChange,
  onNetworkSave,
  onUndo,
  onClear,
  canUndo,
  selectedLinkId,
}: EditorMapViewProps) {
  const [showBuildings, setShowBuildings] = useState(true);
  const [editorMode, setEditorMode] = useState(false);
  const mapRef = useRef<MapRef | null>(null);

  const { exportNetwork } = useNetworkExport(network, { onStatusChange });

  const { loading, importData } = useOSMImport(mapRef, {
    onStatusChange,
    onNetworkChange: (network: Network | null) => {
      if (network) {
        onNetworkChange(network);
      }
    },
  });

  const handleLinkClickLocal = useAddNodeOnLink({
    network,
    setNetwork: (updatedNetwork: Network | null) => {
      if (updatedNetwork) {
        onNetworkSave(updatedNetwork, "Added node on link");
      }
    },
    pushToUndoStack: () => {}, // No-op since Editor handles undo
    onStatusChange,
    editorMode,
    onLinkClick,
  });

  const { hoverInfo, handleClick, handleMouseMove, handleMouseLeave } =
    useMapInteractions({
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
    onNetworkChange: (updatedNetwork: Network | null) => {
      if (updatedNetwork) {
        onNetworkSave(updatedNetwork, "Moved node");
      }
    },
    onBeforeChange: () => {}, // No-op since Editor handles undo
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
    onNetworkChange: (updatedNetwork: Network | null) => {
      if (updatedNetwork) {
        onNetworkSave(updatedNetwork, "Added node");
      }
    },
    onBeforeChange: () => {}, // No-op since Editor handles undo
  });

  // Merge display networks - prioritize addDisplayNetwork if adding, otherwise use dragDisplayNetwork
  const displayNetwork = isAddingNode ? addDisplayNetwork : dragDisplayNetwork;

  // Keyboard shortcut for undo (Cmd+Z on Mac, Ctrl+Z on Windows/Linux)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        if (!canUndo) return;

        onUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndo, canUndo]);

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
      handleClick(event);
    },
    [handleClick],
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
      handleMouseMove(event);
    },
    [nodeDragMouseMove, nodeAddMouseMove, handleMouseMove],
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
      onMouseLeave={handleMouseLeave}
    >
      <EditorControls
        onImport={importData}
        onClear={onClear}
        onExport={exportNetwork}
        loading={loading}
        showBuildings={showBuildings}
        onToggleBuildings={toggleBuildings}
        editorMode={editorMode}
        onToggleEditorMode={toggleEditorMode}
        onUndo={onUndo}
        canUndo={canUndo}
      />
      {displayNetwork && (
        <NetworkLayer
          network={displayNetwork}
          hoverInfo={null}
          selectedLinkId={selectedLinkId}
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
