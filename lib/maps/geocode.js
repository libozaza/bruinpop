import { hasValidCoordinates } from "./geo.js";

/** Minimum characters before we attempt geocoding. */
export const MIN_GEOCODE_QUERY_LENGTH = 4;

/** Nominatim viewbox: west, north, east, south (lon/lat). */
export const UCLA_GEOCODE_VIEWBOX = "-118.47,34.085,-118.41,34.045";

export const UCLA_GEOCODE_BIAS = {
  lat: 34.0689,
  lng: -118.4452,
};

/**
 * Bias free-text queries toward UCLA without overwriting specific addresses.
 * @param {string} address
 */
export function buildGeocodeQuery(address) {
  const trimmed = String(address ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  if (
    lower.includes("ucla") ||
    lower.includes("los angeles") ||
    lower.includes("westwood")
  ) {
    return trimmed;
  }

  return `${trimmed}, UCLA, Los Angeles, CA`;
}

/**
 * @param {Array<{ lat?: string, lon?: string, display_name?: string }>} results
 * @returns {{ lat: number, lng: number, label: string } | null}
 */
export function parseNominatimResults(results) {
  if (!Array.isArray(results) || results.length === 0) return null;

  const top = results[0];
  const lat = Number(top.lat);
  const lng = Number(top.lon);

  if (!hasValidCoordinates(lat, lng)) return null;

  const label = String(top.display_name ?? "").trim();
  return { lat, lng, label: label || "" };
}

/**
 * @param {string} query
 * @param {{ bounded?: boolean }} [options]
 */
export function buildNominatimSearchUrl(query, options = {}) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("viewbox", UCLA_GEOCODE_VIEWBOX);

  if (options.bounded) {
    url.searchParams.set("bounded", "1");
  }

  return url;
}
