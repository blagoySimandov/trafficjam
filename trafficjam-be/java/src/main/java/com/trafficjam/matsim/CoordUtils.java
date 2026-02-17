package com.trafficjam.matsim;

import org.matsim.api.core.v01.Coord;
import org.matsim.core.utils.geometry.CoordinateTransformation;
import org.matsim.core.utils.geometry.transformations.TransformationFactory;

/**
 * Simple utility for converting between GeoJSON (WGS84) and MatSim (EPSG:2157) coordinates.
 * 
 * Usage:
 * - GeoJSON to MatSim: CoordUtils.toMatsim(longitude, latitude)
 * - MatSim to GeoJSON: CoordUtils.toGeoJson(matsimCoord)
 */
public class CoordUtils {

    private static final String WGS84 = TransformationFactory.WGS84; // EPSG:4326
    private static final String IRISH_ITM = "EPSG:2157"; // Irish Transverse Mercator

    private static final CoordinateTransformation TO_MATSIM = 
        TransformationFactory.getCoordinateTransformation(WGS84, IRISH_ITM);
    
    private static final CoordinateTransformation TO_GEOJSON = 
        TransformationFactory.getCoordinateTransformation(IRISH_ITM, WGS84);

    /**
     * Convert GeoJSON coordinates to MatSim coordinates.
     * 
     * @param longitude Longitude in degrees (e.g., -8.4756)
     * @param latitude Latitude in degrees (e.g., 51.8985)
     * @return MatSim Coord in meters
     */
    public static Coord toMatsim(double longitude, double latitude) {
        return TO_MATSIM.transform(new Coord(longitude, latitude));
    }

    /**
     * Convert MatSim coordinates to GeoJSON [longitude, latitude].
     * 
     * @param matsimCoord MatSim coordinate
     * @return Array [longitude, latitude]
     */
    public static double[] toGeoJson(Coord matsimCoord) {
        Coord wgs84 = TO_GEOJSON.transform(matsimCoord);
        return new double[] { wgs84.getX(), wgs84.getY() };
    }

    /**
     * Convert MatSim coordinates to GeoJSON [longitude, latitude].
     * 
     * @param x MatSim X coordinate
     * @param y MatSim Y coordinate
     * @return Array [longitude, latitude]
     */
    public static double[] toGeoJson(double x, double y) {
        return toGeoJson(new Coord(x, y));
    }
}