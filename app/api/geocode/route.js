import { NextResponse } from "next/server";
import {
  buildGeocodeQuery,
  buildNominatimReverseUrl,
  buildNominatimSearchUrl,
  MIN_GEOCODE_QUERY_LENGTH,
  parseNominatimResults,
  parseNominatimReverseResult,
} from "@/lib/maps/geocode.js";
import { hasValidCoordinates } from "@/lib/maps/geo.js";

const NOMINATIM_HEADERS = {
  "User-Agent": "BruinPop/1.0 (UCLA campus events; contact: local-dev)",
  Accept: "application/json",
};

/**
 * GET /api/geocode?q=address
 * GET /api/geocode?lat=34.07&lng=-118.44
 *
 * Forward or reverse geocode via OpenStreetMap Nominatim.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");

    if (latParam != null && lngParam != null) {
      const lat = Number(latParam);
      const lng = Number(lngParam);

      if (!hasValidCoordinates(lat, lng)) {
        return NextResponse.json(
          { error: "Invalid coordinates" },
          { status: 400 },
        );
      }

      const parsed = await reverseGeocode(lat, lng);
      if (!parsed) {
        return NextResponse.json(
          { error: "No address found for this pin" },
          { status: 404 },
        );
      }

      return NextResponse.json(parsed, {
        headers: { "Cache-Control": "private, max-age=300" },
      });
    }

    const rawQuery = searchParams.get("q") ?? "";
    const trimmed = rawQuery.trim();

    if (trimmed.length < MIN_GEOCODE_QUERY_LENGTH) {
      return NextResponse.json(
        { error: "Address query is too short" },
        { status: 400 },
      );
    }

    const query = buildGeocodeQuery(trimmed);
    let parsed = await searchNominatim(query, { bounded: true });

    if (!parsed) {
      parsed = await searchNominatim(query, { bounded: false });
    }

    if (!parsed) {
      return NextResponse.json(
        { error: "No matching location found" },
        { status: 404 },
      );
    }

    return NextResponse.json(parsed, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    console.error("GET /api/geocode error:", error);
    return NextResponse.json(
      { error: "Geocoding failed" },
      { status: 502 },
    );
  }
}

/**
 * @param {number} lat
 * @param {number} lng
 */
async function reverseGeocode(lat, lng) {
  const url = buildNominatimReverseUrl(lat, lng);
  const response = await fetch(url, {
    headers: NOMINATIM_HEADERS,
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Nominatim reverse responded with ${response.status}`);
  }

  const payload = await response.json();
  return parseNominatimReverseResult(payload);
}

/**
 * @param {string} query
 * @param {{ bounded?: boolean }} options
 */
async function searchNominatim(query, options) {
  const url = buildNominatimSearchUrl(query, options);
  const response = await fetch(url, {
    headers: NOMINATIM_HEADERS,
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Nominatim responded with ${response.status}`);
  }

  const results = await response.json();
  return parseNominatimResults(results);
}
