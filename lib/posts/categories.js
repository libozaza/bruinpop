// Defines the available post categories (to be changed, maybe an option to add custom categories in the future?) 
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

// exports to Post.js 
export const POST_CATEGORY_IDS = POST_CATEGORIES.map((category) => category.categoryId);

// helper function to find category id
export function getCategoryById(categoryId) {
  return POST_CATEGORIES.find((category) => category.categoryId === categoryId) ?? null;
}

// helper function to clean the selected category IDs and only keep categories our app supports
export function getValidCategoryIds(value) {
  if (!Array.isArray(value)) return [];

  const allowedCategoryIds = new Set(POST_CATEGORY_IDS);

  return [...new Set(value)]
    .map((categoryId) => String(categoryId).trim().toLowerCase())
    .filter((categoryId) => allowedCategoryIds.has(categoryId));
}

// parses category query parameters from the URL, like ?categories=club,food would return ["club", "food"]
export function parseCategoryQuery(value) {
  if (!value) return [];

  return getValidCategoryIds(
    String(value)
      .split(",")
      .map((categoryId) => categoryId.trim()),
  );
}