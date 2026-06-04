import { getHostHypeDelta } from "./engagement.js";

/**
 * Map post interaction actions to host hype delta kinds.
 * Uses state *before* the DB mutation so toggles undo prior effects.
 */

/** @typedef {import('./engagement.js').EngagementKind} EngagementKind */

/**
 * @typedef {Object} InteractionContext
 * @property {{ value: number } | null} [existingVote]
 * @property {object | null} [existingRsvp]
 */

/**
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
