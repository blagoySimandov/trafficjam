import { useState, useRef, useCallback, useEffect } from "react";
import MapGL from "react-map-gl";
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
} from "../../../constants";
import { useOSMImport } from "../../../hooks/use-osm-import";
import { useMapInteractions } from "../../../hooks/use-map-interactions";
import { useNetworkExport } from "../hooks/use-network-export";
import { useNodeDrag } from "../hooks/use-node-drag";
import { useUndoStack } from "../hooks/use-undo-stack";
import { EditorControls } from "./editor-controls";
import { NetworkLayer } from "../../../components/layers/network-layer";
import { TransportLayer } from "../../../components/layers/transport-layer";
import { BuildingLayer } from "../../../components/layers/building-layer";
import { NodeLayer } from "./layers/node-layer";
import { CombinedTooltip } from "../../../components/combined-tooltip";

interface EditorMapViewProps {
  onStatusChange: (status: string) => void;
  onLinkClick: (link: TrafficLink) => void;
}

export function EditorMapView({
  onStatusChange,
  onLinkClick,
}: EditorMapViewProps) {
  const [network, setNetwork] = useState<Network | null>(null);
  const [showBuildings, setShowBuildings] = useState(true);
  const [editorMode, setEditorMode] = useState(false);
  const mapRef = useRef<MapRef | null>(null);

  const { pushToUndoStack, undo, canUndo, clearUndoStack } = useUndoStack();
  const { exportNetwork } = useNetworkExport(network, { onStatusChange });

  const { loading, importData, clear } = useOSMImport(mapRef, {
    onStatusChange,
    onNetworkChange: setNetwork,
  });

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

  const { hoverInfo, handleClick, handleMouseMove, handleMouseLeave } =
    useMapInteractions({
      network,
      mapRef,
      onLinkClick: handleLinkClickLocal,
      editorMode,
    });

  const { isDragging, displayNetwork, draggedNodeId } = useNodeDrag({
    network,
    mapRef,
    editorMode,
    onNetworkChange: setNetwork,
    onBeforeChange: pushToUndoStack,
  });

  const handleUndo = useCallback(() => {
    const previousNetwork = undo();
    if (previousNetwork) {
      setNetwork(previousNetwork);
      onStatusChange("Undid node operation");
    }
  }, [undo, onStatusChange]);

  // Keyboard shortcut for undo (Cmd+Z on Mac, Ctrl+Z on Windows/Linux)
  // Attach listener once and read latest canUndo/onStatusChange via refs to avoid re-registering
  const canUndoRef = useRef(canUndo);
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    canUndoRef.current = canUndo;
  }, [canUndo]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        if (!canUndoRef.current) return;

        const previousNetwork = undo();
        if (previousNetwork) {
          setNetwork(previousNetwork);
          onStatusChangeRef.current("Undid node operation");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo]);

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
  const handleMapMouseMove = useCallback(
    (event: MapMouseEvent) => {
      handleMouseMove(event);
    },
    [handleMouseMove],
  );

  return (
    <MapGL
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
      onClick={handleMapClick}
      onMouseMove={handleMapMouseMove}
      onMouseLeave={handleMouseLeave}
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
        <NetworkLayer network={displayNetwork} hoverInfo={null} />
      )}
      {displayNetwork && (
        <NodeLayer
          network={displayNetwork}
          editorMode={editorMode}
          draggedNodeId={draggedNodeId}
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
    </MapGL>
  );
}
