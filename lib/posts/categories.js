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

export const POST_CATEGORY_IDS = POST_CATEGORIES.map((category) => category.categoryId);

export function getCategoryById(categoryId) {
  return POST_CATEGORIES.find((category) => category.categoryId === categoryId) ?? null;
}

export function normalizeCategoryIds(value) {
  if (!Array.isArray(value)) return [];

  const allowed = new Set(POST_CATEGORY_IDS);
  return [...new Set(value)]
    .map((id) => String(id).trim().toLowerCase())
    .filter((id) => allowed.has(id));
}

export function parseCategoryQuery(value) {
  if (!value) return [];

  return normalizeCategoryIds(
    String(value)
      .split(",")
      .map((id) => id.trim()),
  );
}
