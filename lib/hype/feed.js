import { computeTier } from "./tiers.js";

/**
 * @param {number} postBaseScore
 * @param {number} hostHypeScore
 * @returns {number}
 */
export function combinedFeedRankScore(postBaseScore, hostHypeScore) {
  const base = Number.isFinite(postBaseScore) ? postBaseScore : 0;
  const tier = computeTier(hostHypeScore);
  return base + tier.feedBoost;
}
