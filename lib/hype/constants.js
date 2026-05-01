/**
 * Single source of truth for hype tiers and feed ranking hints.
 * Tune thresholds here; UI and ranking logic read from {@link TIER_DEFINITIONS}.
 */

/** @typedef {'new_host' | 'rising' | 'established' | 'campus_favorite'} HypeTierId */

/**
 * @typedef {Object} HypeTierDefinition
 * @property {HypeTierId} id
 * @property {number} minScore   Inclusive lower bound for this tier (0 for new hosts).
 * @property {string} label      Full label for tooltips / profile.
 * @property {string} shortLabel Badge text.
 * @property {number} feedBoost  Added to a post’s ranking score (arbitrary units until feed exists).
 * @property {string} badgeClass Tailwind classes for the credibility pill (no dark: variants — parent can wrap).
 */

/** @type {HypeTierDefinition[]} Order: increasing minScore; {@link computeTier} picks the highest tier the score qualifies for. */
export const TIER_DEFINITIONS = [
  {
    id: "new_host",
    minScore: 0,
    label: "New host",
    shortLabel: "New",
    feedBoost: 0,
    badgeClass: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600",
  },
  {
    id: "rising",
    minScore: 10,
    label: "Rising host",
    shortLabel: "Rising",
    feedBoost: 5,
    badgeClass: "bg-sky-100 text-sky-900 ring-sky-200 dark:bg-sky-950 dark:text-sky-100 dark:ring-sky-800",
  },
  {
    id: "established",
    minScore: 50,
    label: "Established host",
    shortLabel: "Established",
    feedBoost: 15,
    badgeClass: "bg-violet-100 text-violet-900 ring-violet-200 dark:bg-violet-950 dark:text-violet-100 dark:ring-violet-800",
  },
  {
    id: "campus_favorite",
    minScore: 200,
    label: "Campus favorite",
    shortLabel: "Favorite",
    feedBoost: 35,
    badgeClass: "bg-amber-100 text-amber-950 ring-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-800",
  },
];
