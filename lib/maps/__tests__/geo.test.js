import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extractPostCoordinates,
  hasValidCoordinates,
  postToMapEvent,
  postsToMapEvents,
} from "../geo.js";

test("hasValidCoordinates accepts UCLA campus coords", () => {
  assert.equal(hasValidCoordinates(34.0689, -118.4452), true);
});

test("extractPostCoordinates reads nested location object", () => {
  const coords = extractPostCoordinates({
    location: { lat: 34.0712, lng: -118.4437, label: "Kerckhoff Hall" },
  });
  assert.deepEqual(coords, {
    lat: 34.0712,
    lng: -118.4437,
    label: "Kerckhoff Hall",
  });
});

test("extractPostCoordinates falls back to legacy flat fields", () => {
  const coords = extractPostCoordinates({
    latitude: 34.07,
    longitude: -118.44,
    locationLabel: "Royce Hall",
  });
  assert.equal(coords?.label, "Royce Hall");
});

test("postToMapEvent normalizes API post for map components", () => {
  const event = postToMapEvent({
    id: "abc123",
    title: "Study jam",
    content: "Bring notes",
    creatorUsername: "acm",
    hostHype: { hypeScore: 10, tierId: "rising" },
    address: "Kerckhoff Hall",
    location: { lat: 34.0712, lng: -118.4437, label: "Kerckhoff Hall" },
  });

  assert.ok(event);
  assert.equal(event.latitude, 34.0712);
  assert.equal(event.longitude, -118.4437);
  assert.equal(event.locationLabel, "Kerckhoff Hall");
  assert.equal(event.creatorUsername, "acm");
});

test("postToMapEvent returns null when coordinates missing", () => {
  assert.equal(
    postToMapEvent({ id: "1", title: "No pin", address: "Somewhere" }),
    null,
  );
});

test("postsToMapEvents filters posts without coordinates", () => {
  const events = postsToMapEvents([
    { id: "1", title: "A", location: { lat: 34.07, lng: -118.44 } },
    { id: "2", title: "B", address: "Text only" },
  ]);
  assert.equal(events.length, 1);
  assert.equal(events[0].id, "1");
});
