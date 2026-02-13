import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Plus, Undo, Redo } from 'lucide-react';
import { Map as MapboxMap, Source, Layer, Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { useUndoStack } from '../hooks/useUndoStack';
import { useNodeDrag } from '../hooks/useNodeDrag';
import { useNodeSnap } from '../hooks/useNodeSnap';
import { useNodeCreate } from '../hooks/useNodeCreate';
import './NetworkEditorPage.css';

const NetworkEditorPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const routeLocation = useLocation();
  const mapRef = useRef(null);
  const [editMode, setEditMode] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [metadata, setMetadata] = useState(null);

  // Use undo stack for network state management
  const {
    state: network,
    setState: setNetwork,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoStack(null);

  // Node snapping/merging functionality
  const { snapNodeToNetwork } = useNodeSnap({
    network,
    onNetworkChange: setNetwork,
  });

  // Node dragging functionality
  const { isDragging, draggedNodeId, displayNetwork } = useNodeDrag({
    network,
    mapRef,
    editorMode: editMode,
    onNetworkChange: setNetwork,
    snapNodeToNetwork, // Pass snap function to drag handler
  });

  // Node creation by clicking on links
  useNodeCreate({
    network,
    mapRef,
    editorMode: editMode,
    onNetworkChange: setNetwork,
  });

  // Load network from localStorage
  useEffect(() => {
    const storedData = localStorage.getItem('trafficjam_network');
    if (!storedData) return;

    try {
      const parsed = JSON.parse(storedData);

      // Reconstruct Maps from array entries
      const networkData = {
        nodes: new Map(parsed.nodes),
        links: new Map(parsed.links),
      };

      setNetwork(networkData);
      setMetadata(parsed.metadata);

      console.log(`Loaded network: ${networkData.links.size} links, ${networkData.nodes.size} nodes`);

      // Clear localStorage after loading
      localStorage.removeItem('trafficjam_network');
    } catch (error) {
      console.error('Failed to load network from localStorage:', error);
    }
  }, []);

  // Get location and radius from loaded metadata or fallback to route state
  const { state } = routeLocation;
  const defaultLocation = { lon: 23.322, lat: 42.698 };
  const location = metadata
    ? { lon: metadata.centerLon, lat: metadata.centerLat }
    : (state?.coordinates || defaultLocation);
  const radius = metadata?.radius || state?.radius || 5;

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

  // Create circle for reference
  const createCircleGeoJSON = (lon, lat, radiusKm) => {
    const points = 64;
    const coordinates = [];
    const earthRadiusKm = 6371;
    
    for (let i = 0; i < points; i++) {
      const bearing = (i / points) * 360;
      const lat1Rad = lat * Math.PI / 180;
      const lon1Rad = lon * Math.PI / 180;
      const distanceRad = radiusKm / earthRadiusKm;
      const bearingRad = bearing * Math.PI / 180;
      
      const lat2Rad = Math.asin(
        Math.sin(lat1Rad) * Math.cos(distanceRad) +
        Math.cos(lat1Rad) * Math.sin(distanceRad) * Math.cos(bearingRad)
      );
      
      const lon2Rad = lon1Rad + Math.atan2(
        Math.sin(bearingRad) * Math.sin(distanceRad) * Math.cos(lat1Rad),
        Math.cos(distanceRad) - Math.sin(lat1Rad) * Math.sin(lat2Rad)
      );
      
      coordinates.push([
        lon2Rad * 180 / Math.PI,
        lat2Rad * 180 / Math.PI
      ]);
    }
    coordinates.push(coordinates[0]);
    
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coordinates] }
      }]
    };
  };

  const circleGeoJSON = createCircleGeoJSON(location.lon, location.lat, radius);

  // Use displayNetwork during drag for real-time preview, otherwise use network
  const activeNetwork = displayNetwork || network;

  // Convert network to GeoJSON for rendering (memoized to avoid recalculating on every render)
  const linksGeoJSON = useMemo(() => {
    if (!activeNetwork) return null;
    return {
      type: 'FeatureCollection',
      features: Array.from(activeNetwork.links.values()).map(link => ({
        type: 'Feature',
        properties: {
          id: link.id,
          highway: link.tags.highway,
          name: link.tags.name || 'Unnamed',
        },
        geometry: {
          type: 'LineString',
          coordinates: link.geometry.map(([lat, lon]) => [lon, lat])
        }
      }))
    };
  }, [activeNetwork]);

  const nodesGeoJSON = useMemo(() => {
    if (!activeNetwork) return null;
    return {
      type: 'FeatureCollection',
      features: Array.from(activeNetwork.nodes.values()).map(node => ({
        type: 'Feature',
        properties: {
          id: node.id,
          isDragged: node.id === draggedNodeId,
          connectionCount: node.connectionCount || 1,
        },
        geometry: {
          type: 'Point',
          coordinates: [node.position[1], node.position[0]] // [lon, lat]
        }
      }))
    };
  }, [activeNetwork, draggedNodeId]);

  return (
    <PageContainer className="editor-page">
      {/* Top Bar */}
      <motion.div 
        className="editor-toolbar glass-morphism"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="toolbar-section">
          <Button
            variant="ghost"
            size="small"
            onClick={() => navigate(`/projects/${projectId}/map-selection`)}
          >
            ← Back
          </Button>
          <h2 className="toolbar-title">Network editor</h2>
        </div>
        
        <div className="toolbar-section">
          <Button variant="secondary" size="small">Save</Button>
          <Button variant="secondary" size="small">Save config</Button>
          <Button 
            variant="primary"
            onClick={() => navigate(`/projects/${projectId}/simulation`)}
          >
            Run Simulation
          </Button>
        </div>
      </motion.div>
      
      {/* Editor Area */}
      <motion.div 
        className="editor-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Side Panel */}
        <div className="editor-panel glass-morphism">
          <div className="panel-section">
            <h3 className="panel-section-title">Location Info</h3>
            <div className="config-list">
              <div className="config-item">
                <span>Longitude</span>
                <span className="config-value">{location.lon.toFixed(4)}</span>
              </div>
              <div className="config-item">
                <span>Latitude</span>
                <span className="config-value">{location.lat.toFixed(4)}</span>
              </div>
              <div className="config-item">
                <span>Radius</span>
                <span className="config-value">{radius}km</span>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <h3 className="panel-section-title">Network Data</h3>
            <div className="config-list">
              <div className="config-item">
                <span>Nodes</span>
                <span className="config-value">{network ? network.nodes.size : 0}</span>
              </div>
              <div className="config-item">
                <span>Links</span>
                <span className="config-value">{network ? network.links.size : 0}</span>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <h3 className="panel-section-title">Config</h3>
            <div className="config-list">
              <div className="config-item">
                <span>Iterations</span>
                <span className="config-value">100</span>
              </div>
              <div className="config-item">
                <span>Random Seed</span>
                <span className="config-value">4711</span>
              </div>
              <div className="config-item">
                <span>Coord. System</span>
                <span className="config-value">EPSG:2157</span>
              </div>
            </div>
          </div>
          
          <div className="panel-section">
            <h3 className="panel-section-title">Edit Network</h3>
            <div className="tool-grid">
              <button
                className={`tool-button ${editMode ? 'active' : ''}`}
                onClick={() => setEditMode(!editMode)}
                title="Toggle editor mode (drag nodes)"
              >
                <Pencil size={20} strokeWidth={2} />
              </button>
              <button
                className={`tool-button`}
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                style={{ opacity: canUndo ? 1 : 0.4 }}
              >
                <Undo size={20} strokeWidth={2} />
              </button>
              <button
                className={`tool-button`}
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Shift+Z)"
                style={{ opacity: canRedo ? 1 : 0.4 }}
              >
                <Redo size={20} strokeWidth={2} />
              </button>
            </div>
            {editMode && (
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                {isDragging
                  ? `Dragging node ${draggedNodeId}...`
                  : 'Click and drag nodes to move them. Drag nodes together to merge. Click on links to create new nodes.'
                }
              </div>
            )}
          </div>
        </div>
        
        {/* Map Area */}
        <div className="editor-map">
          <MapboxMap
            ref={mapRef}
            initialViewState={{
              longitude: location.lon,
              latitude: location.lat,
              zoom: 14,
            }}
            style={{ width: '100%', height: '100%', cursor: editMode ? 'crosshair' : 'default' }}
            mapStyle="mapbox://styles/mapbox/light-v11"
            mapboxAccessToken={mapboxToken}
            onLoad={() => setMapReady(true)}
          >
            {/* Road network links */}
            {mapReady && linksGeoJSON && (
              <Source id="network-links" type="geojson" data={linksGeoJSON}>
                <Layer
                  id="links-layer"
                  type="line"
                  paint={{
                    'line-color': [
                      'match',
                      ['get', 'highway'],
                      'motorway', '#ff6b6b',
                      'trunk', '#ffa94d',
                      'primary', '#ffd43b',
                      'secondary', '#69db7c',
                      'tertiary', '#74c0fc',
                      '#95a5a6' // default gray
                    ],
                    'line-width': [
                      'match',
                      ['get', 'highway'],
                      'motorway', 4,
                      'trunk', 3.5,
                      'primary', 3,
                      'secondary', 2.5,
                      'tertiary', 2,
                      1.5 // default
                    ],
                    'line-opacity': 0.8
                  }}
                />
              </Source>
            )}

            {/* Road network nodes */}
            {mapReady && nodesGeoJSON && editMode && (
              <Source id="network-nodes" type="geojson" data={nodesGeoJSON}>
                <Layer
                  id="nodes-layer"
                  type="circle"
                  paint={{
                    // Size based on connection count, 2x larger when dragging
                    'circle-radius': [
                      'case',
                      ['get', 'isDragged'],
                      [
                        'interpolate',
                        ['linear'],
                        ['get', 'connectionCount'],
                        1, 8,  // 1 connection = 8px (2x of 4px)
                        2, 10, // 2 connections = 10px (2x of 5px)
                        3, 12, // 3 connections = 12px (2x of 6px)
                        4, 14  // 4+ connections = 14px (2x of 7px)
                      ],
                      [
                        'interpolate',
                        ['linear'],
                        ['get', 'connectionCount'],
                        1, 4,  // 1 connection = 4px
                        2, 5,  // 2 connections = 5px
                        3, 6,  // 3 connections = 6px
                        4, 7   // 4+ connections = 7px
                      ]
                    ],
                    // Red when dragging, blue otherwise
                    'circle-color': [
                      'case',
                      ['get', 'isDragged'],
                      '#ef4444', // Red when dragging
                      '#3b82f6'  // Blue otherwise
                    ],
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                    'circle-opacity': 0.9
                  }}
                />
              </Source>
            )}

            {/* Radius boundary circle */}
            <Source id="radius-circle" type="geojson" data={circleGeoJSON}>
              <Layer
                id="radius-fill"
                type="fill"
                paint={{
                  'fill-color': '#007AFF',
                  'fill-opacity': 0.05
                }}
              />
              <Layer
                id="radius-stroke"
                type="line"
                paint={{
                  'line-color': '#007AFF',
                  'line-width': 2,
                  'line-dasharray': [5, 5]
                }}
              />
            </Source>

            {/* Center marker */}
            <Marker
              longitude={location.lon}
              latitude={location.lat}
              anchor="center"
            >
              <div style={{
                width: '24px',
                height: '24px',
                backgroundColor: '#007AFF',
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 2px 8px rgba(0, 122, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: 'white',
                  borderRadius: '50%'
                }} />
              </div>
            </Marker>
          </MapboxMap>
        </div>
      </motion.div>
    </PageContainer>
  );
};

export default NetworkEditorPage;
