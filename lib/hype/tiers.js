import { TIER_DEFINITIONS } from "./constants.js";

/**
 * @typedef {Object} HostHypePayload
 * @property {number} hypeScore   nonneg aggregate hype for the host
 * @property {import('./constants').HypeTierId} tierId
 * @property {string} label       human-readable tier name
 * @property {string} shortLabel  compact label for badges
 * @property {number} feedBoost   tier's feed-ranking boost (used by combinedFeedRankScore)
 */

/**
 * @param {number} hypeScore nonnegative aggregate hype for the host
 * @returns {import('./constants').HypeTierDefinition}
 */
export function computeTier(hypeScore) {
  const score = Number.isFinite(hypeScore) ? Math.max(0, hypeScore) : 0;
  let chosen = TIER_DEFINITIONS[0];
  for (const tier of TIER_DEFINITIONS) {
    if (score >= tier.minScore) chosen = tier;
  }
  return chosen;
}

/**
 * @param {number} hypeScore
 * @returns {HostHypePayload}
 */
export function getTierPayload(hypeScore) {
  const tier = computeTier(hypeScore);
  return {
    hypeScore: Number.isFinite(hypeScore) ? Math.max(0, hypeScore) : 0,
    tierId: tier.id,
    label: tier.label,
    shortLabel: tier.shortLabel,
    feedBoost: tier.feedBoost,
  };
}
