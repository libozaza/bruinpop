import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildGeocodeQuery,
  buildNominatimSearchUrl,
  formatReverseGeocodeAddress,
  parseNominatimResults,
  parseNominatimReverseResult,
} from "../geocode.js";

test("buildGeocodeQuery appends UCLA bias for short campus queries", () => {
  assert.equal(
    buildGeocodeQuery("Kerckhoff Hall"),
    "Kerckhoff Hall, UCLA, Los Angeles, CA",
  );
});

test("buildGeocodeQuery leaves queries that already mention UCLA alone", () => {
  assert.equal(
    buildGeocodeQuery("200 UCLA Medical Plaza"),
    "200 UCLA Medical Plaza",
  );
});

test("parseNominatimResults reads the first valid hit", () => {
  const parsed = parseNominatimResults([
    {
      lat: "34.07120",
      lon: "-118.44370",
      display_name: "Kerckhoff Hall, UCLA, Los Angeles, CA",
    },
  ]);

  assert.deepEqual(parsed, {
    lat: 34.0712,
    lng: -118.4437,
    label: "Kerckhoff Hall, UCLA, Los Angeles, CA",
  });
});

test("parseNominatimResults returns null for empty or invalid results", () => {
  assert.equal(parseNominatimResults([]), null);
  assert.equal(parseNominatimResults([{ lat: "999", lon: "0" }]), null);
});

test("buildNominatimSearchUrl includes UCLA viewbox and bounded flag", () => {
  const url = buildNominatimSearchUrl("Powell Library", { bounded: true });
  assert.match(url.hostname, /nominatim\.openstreetmap\.org/);
  assert.equal(url.searchParams.get("bounded"), "1");
  assert.ok(url.searchParams.get("viewbox"));
});

test("formatReverseGeocodeAddress prefers street-level parts", () => {
  const label = formatReverseGeocodeAddress({
    display_name: "Kerckhoff Hall, Westwood, Los Angeles, CA, USA",
    address: {
      road: "Kerckhoff Drive",
      university: "UCLA",
      suburb: "Westwood",
    },
  });

  assert.match(label, /Kerckhoff Drive/);
});

test("parseNominatimReverseResult returns label for valid reverse payload", () => {
  const parsed = parseNominatimReverseResult({
    lat: "34.0712",
    lon: "-118.4437",
    display_name: "Kerckhoff Hall, UCLA, Los Angeles, CA",
    address: { road: "Kerckhoff Drive", university: "UCLA" },
  });

  assert.ok(parsed);
  assert.equal(parsed.lat, 34.0712);
  assert.equal(parsed.lng, -118.4437);
  assert.ok(parsed.label.length > 0);
});
