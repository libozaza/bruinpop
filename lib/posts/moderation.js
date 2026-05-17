import { normalizeCategoryIds } from "./categories";

export const REPORT_REASONS = [
  {
    categoryId: "hate-speech",
    label: "Hate speech",
    description: "Attacks or demeaning language toward a protected group.",
  },
  {
    categoryId: "harassment",
    label: "Harassment or bullying",
    description: "Targeted abuse, threats, or repeated unwanted behavior.",
  },
  {
    categoryId: "offensive-imagery",
    label: "Offensive imagery",
    description: "Graphic, hateful, or intentionally disturbing visual content.",
  },
  {
    categoryId: "spam-or-scam",
    label: "Spam or scam",
    description: "Misleading promotions, fake events, or suspicious links.",
  },
  {
    categoryId: "unsafe-event",
    label: "Unsafe event",
    description: "Events that appear dangerous, illegal, or harmful.",
  },
  {
    categoryId: "other",
    label: "Other",
    description: "Something else that should be reviewed by moderators.",
  },
];

export const REPORT_REASON_CATEGORY_IDS = REPORT_REASONS.map((reason) => reason.categoryId);

const DEFAULT_BLOCKED_TERMS = [
  "kill yourself",
  "kys",
  "go die",
];

function configuredBlockedTerms() {
  const fromEnv = process.env.CONTENT_BLOCKLIST;
  if (!fromEnv) return DEFAULT_BLOCKED_TERMS;

  return fromEnv
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean);
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function validatePostPayload({ title, content, categories }) {
  const safeTitle = String(title ?? "").trim();
  const safeContent = String(content ?? "").trim();
  const safeCategories = normalizeCategoryIds(categories);

  if (!safeTitle || !safeContent) {
    return { ok: false, error: "Title and content are required" };
  }

  if (safeTitle.length < 5) {
    return { ok: false, error: "Title must be at least 5 characters" };
  }

  if (safeTitle.length > 100) {
    return { ok: false, error: "Title cannot exceed 100 characters" };
  }

  if (safeContent.length > 1000) {
    return { ok: false, error: "Content cannot exceed 1000 characters" };
  }

  if (safeCategories.length === 0) {
    return { ok: false, error: "Select at least one category" };
  }

  return {
    ok: true,
    value: {
      title: safeTitle,
      content: safeContent,
      categories: safeCategories,
    },
  };
}

export function scanPostContent({ title, content }) {
  const normalized = normalizeText(`${title} ${content}`);
  const matchedTerm = configuredBlockedTerms().find((term) => {
    const normalizedTerm = normalizeText(term);
    return normalizedTerm && normalized.includes(normalizedTerm);
  });

  if (!matchedTerm) {
    return { allowed: true, reason: null };
  }

  return {
    allowed: false,
    reason:
      "This post could not be published because it appears to contain unsafe or offensive language. Please revise it and try again.",
  };
}

export function normalizeReportReason(value) {
  const categoryId = String(value ?? "").trim().toLowerCase();
  return REPORT_REASON_CATEGORY_IDS.includes(categoryId) ? categoryId : null;
}
