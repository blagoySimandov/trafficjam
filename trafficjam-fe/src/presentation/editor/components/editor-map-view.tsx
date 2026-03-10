import { useState, useRef, useCallback } from "react";
import Map from "react-map-gl";
import type { MapRef, MapMouseEvent } from "react-map-gl";
import { useHotkeys } from "react-hotkeys-hook";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Network, TrafficLink, Building } from "../../../types";
import {
  MAP_STYLE,
  MAPBOX_TOKEN,
  INTERACTIVE_LAYER_IDS,
  MIN_EDIT_ZOOM,
  HOTSPOT_PATTERN_ID,
  type CityConfig,
} from "../../../constants";
import { useAddNodeOnLink } from "../hooks/use-add-node-on-link";
import { useMapInteractions } from "../../../hooks/use-map-interactions";
import { useNetworkExport } from "../hooks/use-network-export";
import { useNodeDrag } from "../hooks/use-node-drag";
import { useNodeAdd } from "../hooks/use-node-add";
import { EditorControls } from "./editor-controls";
import { NetworkLayer } from "../../../components/layers/network-layer";
import { BuildingLayer } from "../../../components/layers/building-layer";
import { NodeLayer } from "./layers/node-layer";
import { CombinedTooltip } from "../../../components/combined-tooltip";
import { getMaxBounds } from "../../../utils";

interface EditorMapViewProps {
  network: Network | null;
  city: CityConfig;
  onNetworkSave: (network: Network, message: string) => void;
  onStatusChange: (status: string) => void;
  onLinkClick: (link: TrafficLink, modKey: boolean) => void;
  onBuildingClick?: (building: Building) => void;
  onUndo: () => void;
  onClear: () => void;
  canUndo: boolean;
  selectedLinkId: string[];
}

export function EditorMapView({
  network,
  city,
  onStatusChange,
  onLinkClick,
  onBuildingClick,
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

  const handleLinkClickLocal = useAddNodeOnLink({
    network,
    setNetwork: (updatedNetwork: Network | null) => {
      if (updatedNetwork) {
        onNetworkSave(updatedNetwork, "Added node on link");
      }
    },
    pushToUndoStack: () => { },
    onStatusChange,
    editorMode,
    onLinkClick,
  });

  const { hoverInfo, onClick, onMouseMove, onMouseLeave } = useMapInteractions({
    network,
    mapRef,
    onLinkClick: handleLinkClickLocal,
    onBuildingClick,
    editorMode,
  });

  const {
    isDragging,
    draftNetwork: dragDraftNetwork,
    draggedNodeId,
    hiddenIds: dragHiddenIds,
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
    onBeforeChange: () => { },
  });

  const {
    isAddingNode,
    draftNetwork: addDraftNetwork,
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
    onBeforeChange: () => { },
  });

  const baseNetwork = network;

  useHotkeys(
    "mod+z",
    (e) => {
      e.preventDefault();
      if (canUndo) onUndo();
    },
    [onUndo, canUndo],
  );

  const handleMapRef = useCallback((ref: MapRef | null) => {
    mapRef.current = ref;
  }, []);

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || map.hasImage(HOTSPOT_PATTERN_ID)) return;
    const size = 8;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#FF6B00";
    ctx.fillRect(0, 0, size, 4);
    const { data } = ctx.getImageData(0, 0, size, size);
    map.addImage(HOTSPOT_PATTERN_ID, { width: size, height: size, data });
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
      onLoad={handleMapLoad}
      initialViewState={{
        longitude: city.center[0],
        latitude: city.center[1],
        zoom: city.zoom,
      }}
      maxBounds={getMaxBounds(city)}
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
        onClear={onClear}
        onExport={exportNetwork}
        showBuildings={showBuildings}
        onToggleBuildings={toggleBuildings}
        editorMode={editorMode}
        onToggleEditorMode={toggleEditorMode}
        onUndo={onUndo}
        canUndo={canUndo}
      />
      {baseNetwork && (
        <NetworkLayer
          network={baseNetwork}
          hoverInfo={null}
          selectedLinkId={selectedLinkId}
          idPrefix="static"
          filterIds={isDragging ? dragHiddenIds : []}
        />
      )}
      {baseNetwork && (
        <NodeLayer
          network={baseNetwork}
          editorMode={editorMode}
          draggedNodeId={draggedNodeId}
          tempNodeId={isAddingNode ? tempNodeId : null}
          idPrefix="static"
          filterIds={isDragging ? dragHiddenIds : []}
        />
      )}
      {(isDragging && dragDraftNetwork) || (isAddingNode && addDraftNetwork) ? (
        <>
          <NetworkLayer
            network={
              (isDragging ? dragDraftNetwork : addDraftNetwork) as Network
            }
            hoverInfo={null}
            selectedLinkId={selectedLinkId}
            idPrefix="draft"
          />
          <NodeLayer
            network={
              (isDragging ? dragDraftNetwork : addDraftNetwork) as Network
            }
            editorMode={editorMode}
            draggedNodeId={draggedNodeId}
            tempNodeId={isAddingNode ? tempNodeId : null}
            idPrefix="draft"
          />
        </>
      ) : null}

      {showBuildings &&
        baseNetwork?.buildings &&
        baseNetwork.buildings.size > 0 && (
          <BuildingLayer buildings={baseNetwork.buildings} />
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
