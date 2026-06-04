import { hasValidCoordinates } from "./geo.js";

/** minimum characters before attempt geocoding */
export const MIN_GEOCODE_QUERY_LENGTH = 4;

/** viewbox: west, north, east, south (lon/lat) */
export const UCLA_GEOCODE_VIEWBOX = "-118.47,34.085,-118.41,34.045";

export const UCLA_GEOCODE_BIAS = {
  lat: 34.0689,
  lng: -118.4452,
};

/**
 * bias free extended text queries toward UCLA without overwriting specific addresses
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

/**
 * @param {number} lat
 * @param {number} lng
 */
export function buildNominatimReverseUrl(lat, lng) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  return url;
}

/**
 * GenAI-assisted (Cursor)
 * Prompt: Pure reverse-geocode label from Nominatim addressdetails; fallback display_name; cap 200 chars.
 * Solution: formatReverseGeocodeAddress builds street-first string; parseNominatimReverseResult validates lat/lng + label.
 * Reflection: Pin-drag UX needed readable addresses without bloating the route; I reviewed fallbacks so campus pins never return blank.
 *
 * @param {object} payload
 */
export function formatReverseGeocodeAddress(payload) {
  if (!payload) return "";

  const addr = payload.address;
  if (addr && typeof addr === "object") {
    const street =
      addr.house_number && addr.road
        ? `${addr.house_number} ${addr.road}`
        : addr.road;
    const parts = [
      street,
      addr.building,
      addr.amenity,
      addr.university,
      addr.suburb || addr.neighbourhood,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.slice(0, 2).join(", ").trim().slice(0, 200);
    }
  }

  const display = String(payload.display_name ?? "").trim();
  if (display) {
    return display.split(",").slice(0, 3).join(",").trim().slice(0, 200);
  }

  return "";
}

/**
 * @param {object} payload
 * @returns {{ lat: number, lng: number, label: string } | null}
 */
export function parseNominatimReverseResult(payload) {
  if (!payload || payload.error) return null;

  const lat = Number(payload.lat);
  const lng = Number(payload.lon);
  if (!hasValidCoordinates(lat, lng)) return null;

  const label = formatReverseGeocodeAddress(payload) || "Pinned location";
  return { lat, lng, label };
}
