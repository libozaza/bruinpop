/**
 * How much the **event host’s** hype changes when someone engages with their post.
 * Adjust weights here to match your product spec; keep in sync with backend when it exists.
 */

/** @typedef {'like' | 'downvote' | 'rsvp' | 'share' | 'comment'} EngagementKind */

/** @type {Record<EngagementKind, number>} */
export const HOST_HYPE_DELTA = {
  like: 1,
  downvote: -1,
  rsvp: 1,
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
 * @returns {number} New hype (floored at 0).
 */
export function applyHostHypeDelta(currentHostHype, kind) {
  const base = Number.isFinite(currentHostHype) ? currentHostHype : 0;
  const next = base + getHostHypeDelta(kind);
  return Math.max(0, next);
}
