import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Map, { Source, Layer, Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import './MapSelectionPage.css';
import { fetchOSMData } from '../osm';
import { filterNetworkByRadius } from '../utils/radiusFilter';

// Helper to create a circle GeoJSON from center and radius (in km)
const createCircleGeoJSON = (lon, lat, radiusKm) => {
  const points = 64;
  const coordinates = [];
  const earthRadiusKm = 6371;
  
  for (let i = 0; i < points; i++) {
    const bearing = (i / points) * 360;
    
    // Calculate destination point using Haversine formula
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
  coordinates.push(coordinates[0]); // Close the circle
  
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        }
      }
    ]
  };
};

// Helper to calculate bounding box from center and radius
const calculateBoundingBox = (center, radiusKm) => {
  const earthRadiusKm = 6371;
  const latDelta = (radiusKm / earthRadiusKm) * (180 / Math.PI);
  const lonDelta = (radiusKm / (earthRadiusKm * Math.cos(center.lat * Math.PI / 180))) * (180 / Math.PI);

  return {
    getSouth: () => center.lat - latDelta,
    getNorth: () => center.lat + latDelta,
    getWest: () => center.lon - lonDelta,
    getEast: () => center.lon + lonDelta
  };
};

const MapSelectionPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [selectedLocation, setSelectedLocation] = useState('23.322, 42.698');
  const [radius, setRadius] = useState(5);
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);

  // Disable Mapbox telemetry
  useEffect(() => {
    if (window.mapboxgl) {
      window.mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
    }
  }, []);

  // Parse location string to lat/lon
  const parseLocation = (locationStr) => {
    if (!locationStr) return { lat: 42.698, lon: 23.322 };
    const parts = locationStr.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lon: parts[0], lat: parts[1] };
    }
    return { lat: 42.698, lon: 23.322 };
  };

  const location = parseLocation(selectedLocation);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
  const circleGeoJSON = createCircleGeoJSON(location.lon, location.lat, Number(radius));

  // Handle map click to drop pin
  const handleMapClick = (e) => {
    if (!mapReady) return;
    const { lng, lat } = e.lngLat;
    setSelectedLocation(`${lng.toFixed(4)}, ${lat.toFixed(4)}`);
  };

  // Handle save network - fetch OSM data and filter by radius
  const handleSaveNetwork = async () => {
    if (loading) return;

    // Validate radius
    const radiusNum = Number(radius);
    const MAX_RADIUS_KM = 10;
    if (radiusNum > MAX_RADIUS_KM) {
      alert(`Please select a radius smaller than ${MAX_RADIUS_KM}km to avoid API timeouts`);
      return;
    }

    setLoading(true);

    try {
      console.log('Starting OSM data fetch...');
      console.log('Location:', location);
      console.log('Radius (km):', radiusNum, typeof radiusNum);

      // Step 1: Calculate bounding box (1.5x radius for safety margin)
      const expandedRadiusKm = radiusNum * 1.5;
      const bounds = calculateBoundingBox(location, expandedRadiusKm);
      console.log('Bounding box:', {
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast()
      });

      // Step 2: Fetch OSM data
      console.log('Fetching OSM data...');
      const rawNetwork = await fetchOSMData(bounds);
      console.log('Raw network:', rawNetwork);

      // Step 3: Filter by exact radius
      console.log('Filtering network by radius...');
      const filteredNetwork = filterNetworkByRadius(rawNetwork, location, radiusNum);
      console.log('Filtered network:', filteredNetwork);

      // Step 4: Validate results
      if (filteredNetwork.nodes.size === 0 || filteredNetwork.links.size === 0) {
        alert('No road network found in selected area. Try a different location or larger radius.');
        setLoading(false);
        return;
      }

      // Step 5: Store in localStorage (convert Maps to arrays for JSON serialization)
      localStorage.setItem('trafficjam_network', JSON.stringify({
        nodes: Array.from(filteredNetwork.nodes.entries()),
        links: Array.from(filteredNetwork.links.entries()),
        transportRoutes: Array.from(filteredNetwork.transportRoutes?.entries() || []),
        buildings: Array.from(filteredNetwork.buildings?.entries() || []),
        metadata: {
          centerLat: location.lat,
          centerLon: location.lon,
          radius: radiusNum,
          timestamp: Date.now()
        }
      }));

      // Step 6: Navigate to NetworkEditorPage
      navigate(`/projects/${projectId}/network-editor`);

    } catch (error) {
      console.error('Failed to fetch OSM data:', error);
      const errorMessage = error.message || 'Unknown error';
      alert(`Failed to load network data: ${errorMessage}\n\nThe Overpass API may be overloaded. Please try again in a moment, or try a smaller radius.`);
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="map-selection-layout">
        {/* Left Panel */}
        <motion.div 
          className="map-panel glass-morphism"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="panel-header">
            <Button 
              variant="ghost" 
              size="small"
              onClick={() => navigate('/projects')}
            >
              ← Projects
            </Button>
          </div>
          
          <div className="panel-content">
            <h2 className="panel-title">Map Selection</h2>
            <p className="panel-subtitle">
              Click on the map to set location or enter coordinates
            </p>
            
            <div className="form-group">
              <label className="form-label">Pin Location</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="23.322 42.698"
                value={selectedLocation || ''}
                onChange={(e) => setSelectedLocation(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Network radius
                <span className="label-value">{radius}km</span>
              </label>
              <input 
                type="range"
                className="form-range"
                min="1"
                max="20"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
            </div>
            
            <div className="panel-actions">
              <Button
                variant="primary"
                size="large"
                onClick={handleSaveNetwork}
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Loading Network...' : 'Save Network'}
              </Button>
            </div>
          </div>
        </motion.div>
        
        {/* Right Map Area */}
        <motion.div 
          className="map-viewport glass-morphism"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Map
            ref={mapRef}
            initialViewState={{
              longitude: location.lon,
              latitude: location.lat,
              zoom: 13,
            }}
            style={{ width: '100%', height: '100%', cursor: 'default' }}
            mapStyle="mapbox://styles/mapbox/light-v11"
            mapboxAccessToken={mapboxToken}
            trackResize={true}
            attributionControl={true}
            onClick={handleMapClick}
            onLoad={() => setMapReady(true)}
          >
            {/* Radius circle layer */}
            <Source id="circle-source" type="geojson" data={circleGeoJSON}>
              <Layer
                id="circle-fill"
                type="fill"
                paint={{
                  'fill-color': '#007AFF',
                  'fill-opacity': 0.1
                }}
              />
              <Layer
                id="circle-stroke"
                type="line"
                paint={{
                  'line-color': '#007AFF',
                  'line-width': 2
                }}
              />
            </Source>

            {/* Pin marker */}
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
                cursor: 'grab',
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
        </motion.div>
      </div>
    </PageContainer>
  );
};

export default MapSelectionPage;
