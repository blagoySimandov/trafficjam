/**
 * Calculate the great circle distance between two points on Earth using the Haversine formula
 * @param {[number, number]} point1 - First point as [lat, lon]
 * @param {[number, number]} point2 - Second point as [lat, lon]
 * @returns {number} Distance in meters
 */
export function calculateHaversineDistance(point1, point2) {
  const [lat1, lon1] = point1;
  const [lat2, lon2] = point2;

  const R = 6371e3; // Earth radius in meters

  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
