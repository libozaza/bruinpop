import { test } from "node:test";
import assert from "node:assert/strict";
import { computeTier, getTierPayload } from "../tiers.js";
import { TIER_DEFINITIONS } from "../constants.js";

test("computeTier: zero score → new_host", () => {
  assert.equal(computeTier(0).id, "new_host");
});

test("computeTier: score just below threshold stays in lower tier", () => {
  assert.equal(computeTier(9).id, "new_host");
  assert.equal(computeTier(49).id, "rising");
  assert.equal(computeTier(199).id, "established");
});

test("computeTier: score exactly at threshold qualifies for new tier", () => {
  assert.equal(computeTier(10).id, "rising");
  assert.equal(computeTier(50).id, "established");
  assert.equal(computeTier(200).id, "campus_favorite");
});

test("computeTier: very high score caps at top tier", () => {
  assert.equal(computeTier(999_999).id, "campus_favorite");
});

test("computeTier: defensive against non-finite input (all collapse to new_host)", () => {
  assert.equal(computeTier(NaN).id, "new_host");
  assert.equal(computeTier(Infinity).id, "new_host");
  assert.equal(computeTier(-Infinity).id, "new_host");
  assert.equal(computeTier(undefined).id, "new_host");
  assert.equal(computeTier(null).id, "new_host");
  assert.equal(computeTier("100").id, "new_host");
});

test("computeTier: defensive against negative input", () => {
  assert.equal(computeTier(-100).id, "new_host");
});

test("getTierPayload: shape contract", () => {
  const payload = getTierPayload(75);
  assert.deepEqual(Object.keys(payload).sort(), [
    "feedBoost",
    "hypeScore",
    "label",
    "shortLabel",
    "tierId",
  ]);
  assert.equal(payload.tierId, "established");
  assert.equal(payload.hypeScore, 75);
  assert.equal(typeof payload.label, "string");
  assert.equal(typeof payload.shortLabel, "string");
  assert.equal(typeof payload.feedBoost, "number");
});

test("getTierPayload: clamps negative hypeScore to 0 in returned shape", () => {
  const payload = getTierPayload(-5);
  assert.equal(payload.hypeScore, 0);
  assert.equal(payload.tierId, "new_host");
});

test("TIER_DEFINITIONS: ordered by ascending minScore (invariant computeTier relies on)", () => {
  for (let i = 1; i < TIER_DEFINITIONS.length; i++) {
    assert.ok(
      TIER_DEFINITIONS[i].minScore > TIER_DEFINITIONS[i - 1].minScore,
      `tier ${i} (${TIER_DEFINITIONS[i].id}) must have a higher minScore than tier ${i - 1}`,
    );
  }
});

test("TIER_DEFINITIONS: lowest tier starts at 0 so every nonneg score has a tier", () => {
  assert.equal(TIER_DEFINITIONS[0].minScore, 0);
});

test("TIER_DEFINITIONS: feedBoost is monotonically non-decreasing (higher trust ≥ same boost)", () => {
  for (let i = 1; i < TIER_DEFINITIONS.length; i++) {
    assert.ok(
      TIER_DEFINITIONS[i].feedBoost >= TIER_DEFINITIONS[i - 1].feedBoost,
      `tier ${TIER_DEFINITIONS[i].id} has lower feedBoost than its predecessor`,
    );
  }
});
