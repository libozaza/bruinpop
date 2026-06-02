export const POST_CATEGORIES = [
  {
    categoryId: "club",
    label: "Club Event",
    description: "Meetings, tabling, speaker nights, and org-hosted events.",
  },
  {
    categoryId: "party",
    label: "Party",
    description: "Social events, house parties, and nightlife plans.",
  },
  {
    categoryId: "study",
    label: "Study",
    description: "Study jams, tutoring, project groups, and review sessions.",
  },
  {
    categoryId: "sports",
    label: "Sports",
    description: "Pickup games, watch parties, tournaments, and workouts.",
  },
  {
    categoryId: "food",
    label: "Food",
    description: "Food runs, pop-ups, free food, and shared meals.",
  },
  {
    categoryId: "arts",
    label: "Arts",
    description: "Shows, galleries, performances, music, and creative meetups.",
  },
  {
    categoryId: "volunteer",
    label: "Volunteer",
    description: "Service projects, fundraisers, and community support.",
  },
  {
    categoryId: "other",
    label: "Other",
    description: "Anything that does not fit the common categories yet.",
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