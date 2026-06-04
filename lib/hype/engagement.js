/**
 * How much the **event host’s** hype changes when someone engages with their post.
 * Adjust weights here to match your product spec; keep in sync with backend when it exists.
 */

/** @typedef {'like' | 'unlike' | 'downvote' | 'undownvote' | 'rsvp' | 'unrsvp' | 'share' | 'comment'} EngagementKind */

/** @type {Record<EngagementKind, number>} */
// GenAI-assisted (Cursor)
// Prompt: Add unlike/undownvote/unrsvp inverses for toggle-aware hype kinds.
// Solution: HOST_HYPE_DELTA entries ±1 paired with getHypeKindsForInteraction branches.
// Reflection: Weights stay centralized here; I chose symmetric undo values so route logic stays dumb and testable.
export const HOST_HYPE_DELTA = {
  like: 1,
  unlike: -1,
  downvote: -1,
  undownvote: 1,
  rsvp: 1,
  unrsvp: -1,
  share: 1,
  comment: 1,
};

/**
 * @param {EngagementKind} kind
 * @returns {number}
 */
export function getHostHypeDelta(kind) {
  const delta = HOST_HYPE_DELTA[kind];
  if (delta === undefined) {
    throw new Error(`Unknown engagement kind: ${kind}`);
  }
  return delta;
}

/**
 * @param {number} currentHostHype
 * @param {EngagementKind} kind
 * @returns {number} 
 */
export function applyHostHypeDelta(currentHostHype, kind) {
  const base = Number.isFinite(currentHostHype) ? currentHostHype : 0;
  const next = base + getHostHypeDelta(kind);
  return Math.max(0, next);
}
