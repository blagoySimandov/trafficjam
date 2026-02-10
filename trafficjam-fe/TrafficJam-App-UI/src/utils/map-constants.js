// Default map center (Cork, Ireland)
export const DEFAULT_CENTER = [23.322, 42.698];
export const DEFAULT_ZOOM = 15;

// Mapbox configuration
export const MAP_STYLE = 'mapbox://styles/mapbox/light-v11';
export const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN || '').trim();

// Debug: log token status
if (typeof window !== 'undefined') {
  console.log('Mapbox token loaded:', MAPBOX_TOKEN ? `${MAPBOX_TOKEN.substring(0, 10)}...` : 'NOT FOUND');
}

// Map interaction settings
export const MAP_PITCH = 0;
export const MAP_BEARING = 0;
