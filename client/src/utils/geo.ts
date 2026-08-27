const EARTH_RADIUS_METERS = 6371000;
const DEG_TO_RAD = Math.PI / 180;
// Metres per degree of latitude. Longitude degrees shrink by cos(latitude).
const METERS_PER_DEG_LAT = EARTH_RADIUS_METERS * DEG_TO_RAD;

/**
 * Calculate distance between two lat/lng coordinates in meters using Haversine formula.
 *
 * Rounded to whole metres — intended for display. Use `fastDistanceInMeters` for
 * hot-path maths where sub-metre precision matters.
 */
export function calculateDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return Math.round(fastDistanceInMeters(lat1, lon1, lat2, lon2));
}

/**
 * Unrounded equirectangular distance in meters, scaled for local latitude.
 *
 * Accurate to well under a centimetre across a campus-sized area and free of the
 * trigonometry Haversine needs, which matters because route projection calls this
 * once per polyline segment on every GPS fix.
 */
export function fastDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const midLatRad = ((lat1 + lat2) / 2) * DEG_TO_RAD;
  const dLat = (lat2 - lat1) * METERS_PER_DEG_LAT;
  const dLon = (lon2 - lon1) * METERS_PER_DEG_LAT * Math.cos(midLatRad);
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/**
 * Format meters to human readable string (e.g. 320 m or 1.2 km)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Estimate walking time in minutes based on average walking speed (~1.3 m/s)
 */
export function calculateETAInMinutes(meters: number): number {
  const walkingSpeedMetersPerMin = 78; // ~4.7 km/h
  const mins = Math.ceil(meters / walkingSpeedMetersPerMin);
  return Math.max(1, mins);
}
