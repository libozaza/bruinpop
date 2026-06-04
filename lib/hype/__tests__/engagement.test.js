import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HOST_HYPE_DELTA,
  getHostHypeDelta,
  applyHostHypeDelta,
} from "../engagement.js";

test("HOST_HYPE_DELTA: every documented kind has a finite numeric weight", () => {
  for (const [kind, delta] of Object.entries(HOST_HYPE_DELTA)) {
    assert.equal(typeof delta, "number", `${kind} delta should be numeric`);
    assert.ok(Number.isFinite(delta), `${kind} delta should be finite`);
  }
});

test("HOST_HYPE_DELTA: negative weights are downvote, unlike, and unrsvp", () => {
  const negativeKinds = new Set(["downvote", "unlike", "unrsvp"]);
  for (const [kind, delta] of Object.entries(HOST_HYPE_DELTA)) {
    if (negativeKinds.has(kind)) {
      assert.ok(delta < 0, `${kind} should reduce host hype`);
    } else {
      assert.ok(delta > 0, `${kind} should increase host hype`);
    }
  }
});

test("getHostHypeDelta: known kinds return the table value", () => {
  assert.equal(getHostHypeDelta("like"), HOST_HYPE_DELTA.like);
  assert.equal(getHostHypeDelta("downvote"), HOST_HYPE_DELTA.downvote);
  assert.equal(getHostHypeDelta("rsvp"), HOST_HYPE_DELTA.rsvp);
});

test("getHostHypeDelta: unknown kinds throw (fail-loud contract)", () => {
  assert.throws(() => getHostHypeDelta("nonsense"), /Unknown engagement kind/);
  assert.throws(() => getHostHypeDelta(undefined), /Unknown engagement kind/);
});

test("applyHostHypeDelta: adds positive delta", () => {
  assert.equal(applyHostHypeDelta(10, "like"), 10 + HOST_HYPE_DELTA.like);
});

test("applyHostHypeDelta: floors at 0 on downvote against zero-scored host", () => {
  assert.equal(applyHostHypeDelta(0, "downvote"), 0);
});

test("applyHostHypeDelta: floors at 0 when delta would drive negative", () => {
  const downvote = HOST_HYPE_DELTA.downvote;
  const base = Math.max(0, Math.floor(Math.abs(downvote) / 2));
  assert.equal(applyHostHypeDelta(base, "downvote"), 0);
});

test("applyHostHypeDelta: defensive against non-finite current value", () => {
  assert.equal(applyHostHypeDelta(NaN, "like"), HOST_HYPE_DELTA.like);
  assert.equal(applyHostHypeDelta(undefined, "like"), HOST_HYPE_DELTA.like);
});

test("applyHostHypeDelta: unknown kind propagates the throw", () => {
  assert.throws(() => applyHostHypeDelta(10, "bogus"));
});
