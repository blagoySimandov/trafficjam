import proj4 from 'proj4';

const WGS84 = 'EPSG:4326';

const PROJECTION_DEFS = {
  // Ireland 
  'EPSG:2157': '+proj=tmerc +lat_0=53.5 +lon_0=-8 +k=0.99982 +x_0=600000 +y_0=750000 +ellps=GRS80 +units=m +no_defs',

  // UK
  'EPSG:27700': '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +units=m +no_defs',

  // Germany
  'EPSG:25832': '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs',

  // France
  'EPSG:2154': '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs',

  // Netherlands
  'EPSG:28992': '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +no_defs',

  // Spain
  'EPSG:25830': '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs',

  // Italy
  'EPSG:32632': '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs',

  // Portugal
  'EPSG:3763': '+proj=tmerc +lat_0=39.66825833333333 +lon_0=-8.133108333333334 +k=1 +x_0=0 +y_0=0 +ellps=GRS80 +units=m +no_defs',
};

Object.entries(PROJECTION_DEFS).forEach(([code, def]) => {
  proj4.defs(code, def);
});

export type ProjectedCoords = [number, number];
export type WGS84Coords = [number, number];

export interface CoordinateBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export function detectProjectedCRS(bounds: CoordinateBounds): string {
  const centerLat = (bounds.north + bounds.south) / 2;
  const centerLon = (bounds.east + bounds.west) / 2;

  // Ireland
  if (centerLat >= 51 && centerLat <= 56 && centerLon >= -11 && centerLon <= -5) {
    return 'EPSG:2157';
  }

  // UK
  if (centerLat >= 49 && centerLat <= 61 && centerLon >= -2 && centerLon <= 2) {
    return 'EPSG:27700';
  }

  // Netherlands
  if (centerLat >= 50 && centerLat <= 54 && centerLon >= 3 && centerLon <= 8) {
    return 'EPSG:28992';
  }

  // France
  if (centerLat >= 42 && centerLat <= 51 && centerLon >= -5 && centerLon <= 8) {
    return 'EPSG:2154';
  }

  // Germany
  if (centerLat >= 47 && centerLat <= 55 && centerLon >= 5 && centerLon <= 16) {
    return 'EPSG:25832';
  }

  // Spain
  if (centerLat >= 36 && centerLat <= 44 && centerLon >= -10 && centerLon <= 5) {
    return 'EPSG:25830';
  }

  // Portugal
  if (centerLat >= 37 && centerLat <= 42 && centerLon >= -10 && centerLon <= -6) {
    return 'EPSG:3763';
  }

  // Italy
  if (centerLat >= 36 && centerLat <= 47 && centerLon >= 6 && centerLon <= 19) {
    return 'EPSG:32632';
  }

  // USA
  if (centerLat >= 24 && centerLat <= 50 && centerLon >= -125 && centerLon <= -66) {
    const zone = Math.floor((centerLon + 180) / 6) + 1;
    const epsg = `EPSG:${32600 + zone}`;
    // Define UTM zone if not already defined
    if (!proj4.defs(epsg)) {
      proj4.defs(epsg, `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`);
    }
    return epsg;
  }

  // Fallback (default WGS84)
  console.warn('No specific projected CRS detected for bounds, using WGS84');
  return WGS84;
}

/**
 * Transform WGS84 (lat, lon) to projected coordinates [x, y]
 *
 * Note: proj4 expects [lon, lat] order (GeoJSON/x,y standard)
 * Parameters use (lat, lon) for geographic convention
 * Returns [x, y] where for WGS84: x=lon, y=lat
 */
export function wgs84ToProjected(lat: number, lon: number, targetCRS: string): ProjectedCoords {
  if (targetCRS === WGS84) {
    // For WGS84: maintain [x, y] convention where x=lon, y=lat
    return [lon, lat];
  }

  // proj4 expects [lon, lat], returns [x, y]
  const [x, y] = proj4(WGS84, targetCRS, [lon, lat]);
  return [x, y];
}

/**
 * Transform projected coordinates [x, y] to WGS84 (lat, lon)
 *
 * Note: proj4 returns [lon, lat] order (GeoJSON/x,y standard)
 * Returns (lat, lon) for geographic convention
 * For WGS84 input: expects [x, y] where x=lon, y=lat
 */
export function projectedToWGS84(x: number, y: number, sourceCRS: string): WGS84Coords {
  if (sourceCRS === WGS84) {
    // For WGS84: [x, y] means [lon, lat], return as [lat, lon]
    return [y, x];
  }

  // proj4 expects [x, y], returns [lon, lat]
  const [lon, lat] = proj4(sourceCRS, WGS84, [x, y]);
  return [lat, lon];
}

export function euclideanDistance(coord1: ProjectedCoords, coord2: ProjectedCoords): number {
  const dx = coord2[0] - coord1[0];
  const dy = coord2[1] - coord1[1];
  return Math.sqrt(dx * dx + dy * dy);
}

export function getCRSName(epsgCode: string): string {
  const names: Record<string, string> = {
    'EPSG:4326': 'WGS84 (Geographic)',
    'EPSG:2157': 'Irish Transverse Mercator',
    'EPSG:27700': 'British National Grid',
    'EPSG:25832': 'ETRS89 / UTM zone 32N',
    'EPSG:2154': 'Lambert-93 (France)',
    'EPSG:28992': 'Amersfoort / RD New (Netherlands)',
    'EPSG:25830': 'ETRS89 / UTM zone 30N (Spain)',
    'EPSG:32632': 'WGS84 / UTM zone 32N',
    'EPSG:3763': 'Portugal TM06',
  };

  return names[epsgCode] || epsgCode;
}

export interface CountryInfo {
  countryCode: string;
  countryName: string;
  cityName?: string;
}

export function detectCountryInfo(bounds: CoordinateBounds): CountryInfo {
  const centerLat = (bounds.north + bounds.south) / 2;
  const centerLon = (bounds.east + bounds.west) / 2;

  // Ireland
  if (centerLat >= 51 && centerLat <= 56 && centerLon >= -11 && centerLon <= -5) {
    return { countryCode: 'IRL', countryName: 'Ireland' };
  }

  // UK
  if (centerLat >= 49 && centerLat <= 61 && centerLon >= -2 && centerLon <= 2) {
    return { countryCode: 'GBR', countryName: 'United Kingdom' };
  }

  // Netherlands
  if (centerLat >= 50 && centerLat <= 54 && centerLon >= 3 && centerLon <= 8) {
    return { countryCode: 'NLD', countryName: 'Netherlands' };
  }

  // France
  if (centerLat >= 42 && centerLat <= 51 && centerLon >= -5 && centerLon <= 8) {
    return { countryCode: 'FRA', countryName: 'France' };
  }

  // Germany
  if (centerLat >= 47 && centerLat <= 55 && centerLon >= 5 && centerLon <= 16) {
    return { countryCode: 'DEU', countryName: 'Germany' };
  }

  // Spain
  if (centerLat >= 36 && centerLat <= 44 && centerLon >= -10 && centerLon <= 5) {
    return { countryCode: 'ESP', countryName: 'Spain' };
  }

  // Portugal
  if (centerLat >= 37 && centerLat <= 42 && centerLon >= -10 && centerLon <= -6) {
    return { countryCode: 'PRT', countryName: 'Portugal' };
  }

  // Italy
  if (centerLat >= 36 && centerLat <= 47 && centerLon >= 6 && centerLon <= 19) {
    return { countryCode: 'ITA', countryName: 'Italy' };
  }

  // USA
  if (centerLat >= 24 && centerLat <= 50 && centerLon >= -125 && centerLon <= -66) {
    return { countryCode: 'USA', countryName: 'United States' };
  }

  console.warn('No country detected for bounds, using default');
  return { countryCode: 'UNK', countryName: 'Unknown' };
}
