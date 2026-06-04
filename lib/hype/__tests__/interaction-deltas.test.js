import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getHypeKindsForInteraction,
  sumHostHypeDeltas,
} from "../interaction-deltas.js";

test("upvote: new like awards like", () => {
  assert.deepEqual(getHypeKindsForInteraction("upvote", {}), ["like"]);
});

test("upvote: toggle off existing like awards unlike", () => {
  assert.deepEqual(
    getHypeKindsForInteraction("upvote", { existingVote: { value: 1 } }),
    ["unlike"],
  );
});

test("upvote: switch from downvote reverses then likes", () => {
  assert.deepEqual(
    getHypeKindsForInteraction("upvote", { existingVote: { value: -1 } }),
    ["undownvote", "like"],
  );
});

test("downvote: toggle off undoes downvote", () => {
  assert.deepEqual(
    getHypeKindsForInteraction("downvote", { existingVote: { value: -1 } }),
    ["undownvote"],
  );
});

test("downvote: switch from like undoes like then downvotes", () => {
  assert.deepEqual(
    getHypeKindsForInteraction("downvote", { existingVote: { value: 1 } }),
    ["unlike", "downvote"],
  );
});

test("rsvp: duplicate rsvp yields no hype delta", () => {
  assert.deepEqual(
    getHypeKindsForInteraction("rsvp", { existingRsvp: { _id: "x" } }),
    [],
  );
});

test("unrsvp: only when rsvp existed", () => {
  assert.deepEqual(getHypeKindsForInteraction("unrsvp", {}), []);
  assert.deepEqual(
    getHypeKindsForInteraction("unrsvp", { existingRsvp: { _id: "x" } }),
    ["unrsvp"],
  );
});

test("sumHostHypeDeltas: switching from downvote to like nets +2", () => {
  assert.equal(sumHostHypeDeltas(["undownvote", "like"]), 2);
});

test("sumHostHypeDeltas: toggling like off nets -1", () => {
  assert.equal(sumHostHypeDeltas(["unlike"]), -1);
});
