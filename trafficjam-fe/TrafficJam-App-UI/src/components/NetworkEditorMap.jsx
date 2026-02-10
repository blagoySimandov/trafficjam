import { useState, useRef } from 'react';
import Map from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DEFAULT_CENTER, DEFAULT_ZOOM, MAP_STYLE, MAPBOX_TOKEN } from '../utils/map-constants';
import './NetworkEditorMap.css';

const NetworkEditorMap = ({ onStatusChange, onLocationChange }) => {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState({
    longitude: DEFAULT_CENTER[0],
    latitude: DEFAULT_CENTER[1],
    zoom: DEFAULT_ZOOM,
  });

  // Debug token loading
  const hasToken = MAPBOX_TOKEN && MAPBOX_TOKEN.length > 0;

  const handleMapClick = (event) => {
    const { lngLat } = event;
    if (onLocationChange) {
      onLocationChange({
        longitude: lngLat.lng,
        latitude: lngLat.lat,
      });
    }
    if (onStatusChange) {
      onStatusChange(`Location selected: ${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`);
    }
  };

  return (
    <div className="network-editor-map">
      {!hasToken && (
        <div className="map-error">
          ⚠️ Mapbox token not found. Please check your .env file.
        </div>
      )}
      {hasToken && (
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          onClick={handleMapClick}
          style={{ width: '100%', height: '100%' }}
          mapStyle={MAP_STYLE}
          mapboxAccessToken={MAPBOX_TOKEN}
          interactiveLayerIds={[]}
          onError={(error) => {
            console.error('Map error:', error);
            console.error('Token being used:', MAPBOX_TOKEN);
            console.error('Token length:', MAPBOX_TOKEN.length);
            console.error('Token starts with:', MAPBOX_TOKEN.substring(0, 20));
            if (onStatusChange) {
              onStatusChange(`Map error: ${error?.message || 'Check browser console for details'}`);
            }
          }}
          onLoad={() => {
            if (onStatusChange) {
              onStatusChange('Map loaded successfully');
            }
            console.log('Map loaded at', DEFAULT_CENTER);
          }}
        />
      )}
    </div>
  );
}

export default NetworkEditorMap;
