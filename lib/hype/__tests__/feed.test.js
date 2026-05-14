import { test } from "node:test";
import assert from "node:assert/strict";
import { combinedFeedRankScore } from "../feed.js";
import { TIER_DEFINITIONS } from "../constants.js";

const TIER_BY_ID = Object.fromEntries(TIER_DEFINITIONS.map((t) => [t.id, t]));

test("combinedFeedRankScore: new_host adds zero boost", () => {
  assert.equal(combinedFeedRankScore(100, 0), 100 + TIER_BY_ID.new_host.feedBoost);
});

test("combinedFeedRankScore: established tier adds its feedBoost", () => {
  assert.equal(
    combinedFeedRankScore(100, 50),
    100 + TIER_BY_ID.established.feedBoost,
  );
});

test("combinedFeedRankScore: campus_favorite adds its feedBoost", () => {
  assert.equal(
    combinedFeedRankScore(100, 999),
    100 + TIER_BY_ID.campus_favorite.feedBoost,
  );
});

test("combinedFeedRankScore: defensive against non-finite postBaseScore", () => {
  assert.equal(
    combinedFeedRankScore(NaN, 50),
    TIER_BY_ID.established.feedBoost,
  );
  assert.equal(
    combinedFeedRankScore(undefined, 0),
    TIER_BY_ID.new_host.feedBoost,
  );
});

test("combinedFeedRankScore: monotone in host hype (higher hype → ≥ score for fixed base)", () => {
  const base = 50;
  let last = -Infinity;
  for (const tier of TIER_DEFINITIONS) {
    const score = combinedFeedRankScore(base, tier.minScore);
    assert.ok(
      score >= last,
      `tier ${tier.id}: score ${score} should be >= previous ${last}`,
    );
    last = score;
  }
});

test("combinedFeedRankScore: a zero-base post can still rank above another zero-base post when host is more trusted", () => {
  const lowTrustPost = combinedFeedRankScore(0, 0);
  const highTrustPost = combinedFeedRankScore(0, 200);
  assert.ok(highTrustPost > lowTrustPost);
});
