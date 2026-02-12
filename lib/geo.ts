/**
 * Geo utilities for distance calculation and geocoding.
 *
 * - haversine: calculate distance between two lat/lng points
 * - geocodeZip: convert a US zip code to lat/lng via Nominatim (OpenStreetMap)
 * - geocodeAddress: convert a full street address to lat/lng via Nominatim
 *
 * geocodeAddress is the long-term solution: when a new venue is added, call it
 * with the full address to automatically get coordinates — no manual lookup needed.
 */

const EARTH_RADIUS_MILES = 3958.8;

/** Calculate distance in miles between two coordinates using the Haversine formula. */
export function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type GeoResult = { latitude: number; longitude: number } | null;

/**
 * Geocode a US zip code to lat/lng using Nominatim (OpenStreetMap).
 * Free, no API key required. Rate-limited to 1 req/sec by Nominatim policy.
 */
export async function geocodeZip(zip: string): Promise<GeoResult> {
  const query = encodeURIComponent(`${zip}, United States`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us`;

  const res = await fetch(url, {
    headers: { "User-Agent": "KaraokeNights/1.0" },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!data.length) return null;

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
  };
}

/**
 * Geocode a full street address to lat/lng using Nominatim (OpenStreetMap).
 * Use this when onboarding new venues so coordinates are set automatically.
 *
 * Example: geocodeAddress("1179 Elton Street, Brooklyn, New York")
 */
export async function geocodeAddress(address: string): Promise<GeoResult> {
  const query = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us`;

  const res = await fetch(url, {
    headers: { "User-Agent": "KaraokeNights/1.0" },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!data.length) return null;

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
  };
}
