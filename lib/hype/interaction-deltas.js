import { getHostHypeDelta } from "./engagement.js";

/** @typedef {import('./engagement.js').EngagementKind} EngagementKind */

/**
 * @typedef {Object} InteractionContext
 * @property {{ value: number } | null} [existingVote]
 * @property {object | null} [existingRsvp]
 */

/**
 * GenAI-assisted (Cursor)
 * Prompt: Map POST vote/rsvp toggles to EngagementKind[] from pre-transaction Vote/RSVP; add undo kinds; sumHostHypeDeltas; no Mongo.
 * Solution: switch on action → arrays like [undownvote, like] on down→up; sumHostHypeDeltas folds via getHostHypeDelta.
 * Reflection: Kept logic pure so hype rules are testable; I verified toggles undo prior deltas instead of double-counting.
 *
 * @param {string} action
 * @param {InteractionContext} ctx
 * @returns {EngagementKind[]}
 */
export function getHypeKindsForInteraction(action, ctx = {}) {
  const { existingVote = null, existingRsvp = null } = ctx;

  switch (action) {
    case "upvote":
      if (existingVote?.value === 1) return ["unlike"];
      if (existingVote?.value === -1) return ["undownvote", "like"];
      return ["like"];

    case "downvote":
      if (existingVote?.value === -1) return ["undownvote"];
      if (existingVote?.value === 1) return ["unlike", "downvote"];
      return ["downvote"];

    case "share":
      return ["share"];

    case "comment":
      return ["comment"];

    case "rsvp":
      return existingRsvp ? [] : ["rsvp"];

    case "unrsvp":
      return existingRsvp ? ["unrsvp"] : [];

    default:
      return [];
  }
}

/**
 * @param {EngagementKind[]} kinds
 * @returns {number}
 */
export function sumHostHypeDeltas(kinds) {
  return kinds.reduce((total, kind) => total + getHostHypeDelta(kind), 0);
}
