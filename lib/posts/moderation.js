import { cleanCategoryIds } from "./categories";

// List of report reasons for post reporting
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

export const REPORT_REASON_CATEGORY_IDS = REPORT_REASONS.map(
  (reason) => reason.categoryId,
);

// Blocked list, TO BE IMPROVED
const DEFAULT_BLOCKED_TERMS = ["kill yourself", "kys", "go die", "fuck", "shit", "bitch", "ass", "dick"];

// Gets blocked terms from DEFAULT_BLOCKED_TERMS or from environment variable CONTENT_BLOCKLIST
function configuredBlockedTerms() {
  const fromEnv = process.env.CONTENT_BLOCKLIST;

  if (!fromEnv) {
    return DEFAULT_BLOCKED_TERMS;
  }

  return fromEnv
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean);
}

// GenAI Prompt: Given a reports and moderation texts, structure my code andgive me clear formatting in order to standardize a word for filtering

// LLM Response Start: Below is a structured code snippet that includes functions for validating post payloads, scanning post content for moderation, and formatting post data for API responses. The code also includes helper functions for cleaning text and validating report reasons. This structure should help standardize the process of handling posts and reports in your application.
function cleanTextForModeration(value) {
  return String(value ?? "")
    .normalize("NFD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
// This function formats post data for API responses, including populating category labels and user-specific information like votes and RSVPs. It accepts options to optimize database queries when certain data is already available.
// LLM Response End
// Reflection: This was a useful way to use GenAI because I wasn't sure how to make moderation standard and reusable across different parts of the codebase. By structuring the code into clear functions with specific responsibilities, it helps ensure that moderation logic is consistent and can be easily maintained or updated in the future. 


// Main function that validates the payload for a new post
export function validatePostPayload({ title, content, categories }) {
  const safeTitle = String(title ?? "").trim();
  const safeContent = String(content ?? "").trim();
  const safeCategories = cleanCategoryIds(categories);

  // Title/content check
  if (!safeTitle || !safeContent) {
    return { ok: false, error: "Title and content are required" };
  }

  // Extra revalidations
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

// Formats post data for API responses, including populating category labels
export function scanPostContent({ title, content }) {
  const cleanedText = cleanTextForModeration(`${title} ${content}`);

  const matchedTerm = configuredBlockedTerms().find((term) => {
    const cleanedBlockedTerm = cleanTextForModeration(term);
    return cleanedBlockedTerm && cleanedText.includes(cleanedBlockedTerm);
  });

  if (!matchedTerm) {
    return { allowed: true, reason: null };
  }

  // Generic reason for blocked content to avoid giving bad actors specific feedback on what triggered the block (SECURITY PRINCIPLE)
  return {
    allowed: false,
    reason:
      "This post could not be published because it appears to contain unsafe or offensive language. Please revise it and try again.",
  };
}

// Helper function to get valid report reason
export function getValidReportReason(value) {
  const categoryId = String(value ?? "").trim().toLowerCase();
  return REPORT_REASON_CATEGORY_IDS.includes(categoryId) ? categoryId : null;
}