import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildEventDateTime,
  parseEventDateTime,
} from "../event-datetime.js";

test("buildEventDateTime normalizes HH:MM to ISO", () => {
  const result = buildEventDateTime("2026-06-15", "14:30");
  assert.ok("iso" in result);
  assert.ok(parseEventDateTime(result.iso));
});

test("buildEventDateTime rejects missing parts", () => {
  assert.equal(buildEventDateTime("", "14:30").error, "Date and time are required");
});

test("parseEventDateTime accepts composer-style datetime without seconds", () => {
  const parsed = parseEventDateTime("2026-06-15T14:30:00");
  assert.ok(parsed);
});
