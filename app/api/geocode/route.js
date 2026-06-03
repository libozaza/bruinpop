import { NextResponse } from "next/server";
import {
  buildGeocodeQuery,
  buildNominatimSearchUrl,
  MIN_GEOCODE_QUERY_LENGTH,
  parseNominatimResults,
} from "@/lib/maps/geocode.js";

const NOMINATIM_HEADERS = {
  "User-Agent": "BruinPop/1.0 (UCLA campus events; contact: local-dev)",
  Accept: "application/json",
};

/**
 * GET /api/geocode?q=address
 *
 * Proxies OpenStreetMap Nominatim so the client can geocode without CORS issues.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
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
      headers: {
        "Cache-Control": "private, max-age=300",
      },
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
