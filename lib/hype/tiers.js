import { TIER_DEFINITIONS } from "./constants";

/**
 * @param {number} hypeScore Non-negative aggregate hype for the host.
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
 * Convenience for API responses and UI.
 * @param {number} hypeScore
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
