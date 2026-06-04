export const POST_CATEGORIES = [
  {
    categoryId: "club",
    label: "Club Event",
    description: "Meetings, tabling, speaker nights, and org-hosted events.",
    mapPinColor: "#4f46e5",
  },
  {
    categoryId: "party",
    label: "Party",
    description: "Social events, house parties, and nightlife plans.",
    mapPinColor: "#db2777",
  },
  {
    categoryId: "study",
    label: "Study",
    description: "Study jams, tutoring, project groups, and review sessions.",
    mapPinColor: "#2563eb",
  },
  {
    categoryId: "sports",
    label: "Sports",
    description: "Pickup games, watch parties, tournaments, and workouts.",
    mapPinColor: "#16a34a",
  },
  {
    categoryId: "food",
    label: "Food",
    description: "Food runs, pop-ups, free food, and shared meals.",
    mapPinColor: "#d97706",
  },
  {
    categoryId: "arts",
    label: "Arts",
    description: "Shows, galleries, performances, music, and creative meetups.",
    mapPinColor: "#c026d3",
  },
  {
    categoryId: "volunteer",
    label: "Volunteer",
    description: "Service projects, fundraisers, and community support.",
    mapPinColor: "#0d9488",
  },
  {
    categoryId: "other",
    label: "Other",
    description: "Anything that does not fit the common categories yet.",
    mapPinColor: "#71717a",
  },
];

export const POST_CATEGORY_IDS = POST_CATEGORIES.map(
  (category) => category.categoryId,
);

export function getValidCategoryIds(categoryId) {
  return POST_CATEGORIES.find(
    (category) => category.categoryId === categoryId,
  );
}

// Alias for clearer naming in display/formatting code.
// This prevents import errors if a component imports getCategoryById.
export function getCategoryById(categoryId) {
  return getValidCategoryIds(categoryId);
}

export function cleanCategoryIds(categories) {
  if (!Array.isArray(categories)) {
    return [];
  }

  return categories
    .filter((categoryId) => typeof categoryId === "string")
    .map((categoryId) => categoryId.trim())
    .filter((categoryId) => POST_CATEGORY_IDS.includes(categoryId));
}

export function parseCategoryQuery(value) {
  if (!value) {
    return [];
  }

  return cleanCategoryIds(value.split(","));
}

/**
 * pick one category to drive map pin color when a post has several tags
 * uses POST_CATEGORIES order so more specific tags win over other
 *
 * @param {string[]} categoryIds
 * @returns {string}
 */
export function getPrimaryCategoryId(categoryIds) {
  const cleaned = cleanCategoryIds(categoryIds);
  if (cleaned.length === 0) return "other";
  if (cleaned.length === 1) return cleaned[0];

  for (const categoryId of POST_CATEGORY_IDS) {
    if (cleaned.includes(categoryId)) return categoryId;
  }

  return "other";
}

/**
 * @param {string} categoryId
 * @returns {string} 
 */
export function getCategoryMapPinColor(categoryId) {
  const category = getValidCategoryIds(categoryId);
  return category?.mapPinColor ?? "#71717a";
}