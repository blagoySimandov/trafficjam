import { useState, useRef, useCallback } from "react";
import Map from "react-map-gl";
import type { MapMouseEvent, MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Network, TrafficLink } from "../types";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_STYLE,
  MAPBOX_TOKEN,
  INTERACTIVE_LAYER_IDS,
  NODE_LAYER_ID,
} from "../constants";
import { useOSMImport } from "../hooks/use-osm-import";
import { useNetworkExport } from "../hooks/use-network-export";
import { useMapInteractions } from "../hooks/use-map-interactions";
import { useNodeDrag } from "../hooks/use-node-drag";
import { MapControls } from "./map-controls";
import { NetworkLayer } from "./network-layer";
import { TransportLayer } from "./transport-layer";
import { BuildingLayer } from "./building-layer";
import { NodeLayer } from "./node-layer";
import { CombinedTooltip } from "./combined-tooltip";

interface MapViewProps {
  onStatusChange: (status: string) => void;
  onLinkClick: (link: TrafficLink) => void;
}

export function MapView({ onStatusChange, onLinkClick }: MapViewProps) {
  const [network, setNetwork] = useState<Network | null>(null);
  const [showBuildings, setShowBuildings] = useState(true);
  const [editorMode, setEditorMode] = useState(false);
  const mapRef = useRef<MapRef | null>(null);
  const { exportNetwork } = useNetworkExport(network, { onStatusChange });


  const { loading, importData, clear } = useOSMImport(mapRef, {
    onStatusChange,
    onNetworkChange: setNetwork,
  });

  const { hoverInfo, handleClick, handleMouseMove, handleMouseLeave } =
    useMapInteractions({
      network,
      mapRef,
      onLinkClick,
    });

  const {
    handleNodeMouseDown,
    handleMouseMove: handleNodeDragMove,
    handleMouseUp,
    isDragging,
  } = useNodeDrag({
    network,
    mapRef,
    editorMode,
    onNetworkChange: setNetwork,
  });

  const handleMapRef = useCallback((ref: MapRef | null) => {
    mapRef.current = ref;
  }, []);

  const toggleBuildings = useCallback(() => {
    setShowBuildings((prev) => !prev);
  }, []);

  const toggleEditorMode = useCallback(() => {
    setEditorMode((prev) => !prev);
  }, []);

  // const handleExport = useCallback(() => {
  //   if (network) {
  //     // TODO: Implement export functionality
  //     console.log("Export network:", network);
  //   }
  // }, [network]);

  const handleMapClick = useCallback(
    (event: MapMouseEvent) => {
      if (editorMode) {
        handleNodeMouseDown(event);
      } else {
        handleClick(event);
      }
    },
    [editorMode, handleNodeMouseDown, handleClick]
  );

  const handleMapMouseMove = useCallback(
    (event: MapMouseEvent) => {
      if (isDragging) {
        handleNodeDragMove(event);
      } else if (!editorMode) {
        handleMouseMove(event);
      }
    },
    [isDragging, editorMode, handleNodeDragMove, handleMouseMove]
  );

  const handleMapMouseUp = useCallback(() => {
    if (editorMode) {
      handleMouseUp();
    }
  }, [editorMode, handleMouseUp]);

  const interactiveIds = editorMode 
    ? [NODE_LAYER_ID] 
    : network ? INTERACTIVE_LAYER_IDS : [];

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
      interactiveLayerIds={interactiveIds}
      onClick={handleMapClick}
      onMouseMove={handleMapMouseMove}
      onMouseUp={handleMapMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <MapControls
        onImport={importData}
        onClear={clear}
        onExport={exportNetwork}
        loading={loading}
        showBuildings={showBuildings}
        onToggleBuildings={toggleBuildings}
        editorMode={editorMode}
        onToggleEditorMode={toggleEditorMode}
      />
      {network && <NetworkLayer network={network} hoverInfo={null} />}
      {network && <NodeLayer network={network} editorMode={editorMode} />}
      {network?.transportRoutes && network.transportRoutes.size > 0 && (
        <TransportLayer routes={network.transportRoutes} hoverInfo={null} />
      )}
      {showBuildings && network?.buildings && network.buildings.size > 0 && (
        <BuildingLayer buildings={network.buildings} />
      )}
      {hoverInfo && !editorMode && (
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