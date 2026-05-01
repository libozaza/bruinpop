import { computeTier } from "./tiers";

/**
 * Combine a post’s intrinsic score (recency, raw votes, etc.) with the host’s tier boost.
 * Feed can sort by this descending once you have `postBaseScore`.
 *
 * @param {number} postBaseScore
 * @param {number} hostHypeScore
 * @returns {number}
 */
export function combinedFeedRankScore(postBaseScore, hostHypeScore) {
  const base = Number.isFinite(postBaseScore) ? postBaseScore : 0;
  const tier = computeTier(hostHypeScore);
  return base + tier.feedBoost;
}
