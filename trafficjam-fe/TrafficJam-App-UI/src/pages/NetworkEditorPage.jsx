import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Map, { Source, Layer, Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import './NetworkEditorPage.css';

const NetworkEditorPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const routeLocation = useLocation();
  const mapRef = useRef(null);
  const [editMode, setEditMode] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  // Get location and radius from state
  const { state } = routeLocation;
  const defaultLocation = { lon: 23.322, lat: 42.698 };
  const location = state?.coordinates || defaultLocation;
  const radius = state?.radius || 5;

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
            <h3 className="panel-section-title">Network visualizations</h3>
            <div className="panel-options">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>Show nodes as dots</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>Show links as lines</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>Show radius boundary</span>
              </label>
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
                className={`tool-button ${editMode === 'add' ? 'active' : ''}`}
                onClick={() => setEditMode(editMode === 'add' ? null : 'add')}
                title="Add node"
              >
                <Plus size={20} strokeWidth={2} />
              </button>
              <button 
                className={`tool-button ${editMode === 'edit' ? 'active' : ''}`}
                onClick={() => setEditMode(editMode === 'edit' ? null : 'edit')}
                title="Edit node"
              >
                <Pencil size={20} strokeWidth={2} />
              </button>
              <button 
                className={`tool-button ${editMode === 'delete' ? 'active' : ''}`}
                onClick={() => setEditMode(editMode === 'delete' ? null : 'delete')}
                title="Delete node"
              >
                <Trash2 size={20} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Map Area */}
        <div className="editor-map">
          <Map
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
          </Map>
        </div>
      </motion.div>
    </PageContainer>
  );
};

export default NetworkEditorPage;
