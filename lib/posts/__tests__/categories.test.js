import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getCategoryMapPinColor,
  getPrimaryCategoryId,
} from "../categories.js";

test("getPrimaryCategoryId prefers earliest category in catalog order", () => {
  assert.equal(getPrimaryCategoryId(["other", "party", "food"]), "party");
  assert.equal(getPrimaryCategoryId(["study"]), "study");
  assert.equal(getPrimaryCategoryId([]), "other");
});

test("getCategoryMapPinColor returns hex for known categories", () => {
  assert.equal(getCategoryMapPinColor("study"), "#2563eb");
  assert.equal(getCategoryMapPinColor("unknown-id"), "#71717a");
});
