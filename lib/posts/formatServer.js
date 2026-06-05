import { getTierPayload } from "@/lib/hype/tiers.js";
import RSVP from "@/lib/models/RSVP";
import Vote from "@/lib/models/Vote";
import { getValidCategoryIds } from "@/lib/posts/categories";

// [GenAI Use]: Prompt: Create documentation for the function defined below, which formats a post document from the database into the shape needed for the frontend. 
// Result is the JSDoc comment shown above the function definition.
// Reflection: The resulting documentation is pretty detailed and useful. I had to add some descriptions to explain what some of the fields were however.
/**
 * @typedef {Object} FormatPostInput
 * @property {string|import('mongoose').Types.ObjectId} _id
 * @property {string} title
 * @property {string} content
 * @property {Array<string>} [categories]
 * @property {{ username?: string, hypeScore?: number, _id?: string|import('mongoose').Types.ObjectId } | null | undefined} creator
 * @property {string | Date} createdAt
 * @property {number} [votes]
 * @property {number} [shares]
 * @property {number} [comments]
 * @property {number} [RSVPs]
 * @property {Object} [location]
 * @property {number} [reportCount]
 * @property {string} [moderationStatus]
 */

/**
 * Convert a persisted post document into the public API shape used by the feed.
 *
 * Assumes that the caller connects to the database and populates the post's creator field
 * to include at least username and hypeScore.
 *
 * The input should match the Post schema in lib/models/Post.js,
 * with `creator` populated to include at least `username` and `hypeScore`.
 *
 * @param {FormatPostInput} post
 * @param {Object} [token] - used to get userId and creator
 * @param {Array<{
 * _id: string|import('mongoose').Types.ObjectId,
 * content: string,
 * createdAt: string | Date,
 * user?: { username?: string } | null | undefined,
 * }>} [comments=[]]
 * @param {Object} [options={}] - optional post view metadata
 * @param {boolean} [options.hasRsvpd]
 * @param {Array<{
 * _id?: string|import('mongoose').Types.ObjectId,
 * user?: { _id?: string|import('mongoose').Types.ObjectId, username?: string } | string,
 * createdAt?: string | Date,
 * }>} [options.rsvps=[]]
 */
export async function formatPost(post, token, comments = [], options = {}) {
  const userId = token?.id;
  const hypeScore = post.creator?.hypeScore ?? 0;
  const votes = await Vote.find({ post: post._id });
  const userVote = votes.find((vote) => String(vote.user) === String(userId));
  const creatorId = post.creator?._id ? String(post.creator._id) : null;
  const canDelete = Boolean(userId && creatorId && String(userId) === creatorId);
  const categories = Array.isArray(post.categories) ? post.categories : [];
  const rsvps = Array.isArray(options.rsvps) ? options.rsvps : [];
  const rsvpUsers = rsvps.map((rsvp) => ({
    id: String(rsvp.user?._id ?? rsvp.user),
    username: rsvp.user?.username ?? "Unknown",
    createdAt: rsvp.createdAt,
  }));
  const hasRsvpd =
    typeof options.hasRsvpd === "boolean"
      ? options.hasRsvpd
      : rsvpUsers.length > 0
        ? rsvpUsers.some((rsvpUser) => String(rsvpUser.id) === String(userId))
        : Boolean(
            userId && (await RSVP.exists({ post: post._id, user: userId })),
          );
  const rsvpCount =
    typeof options.rsvpCount === "number"
      ? options.rsvpCount
      : await RSVP.countDocuments({ post: post._id });

  const commentList = comments.map((comment) => ({
    id: String(comment._id),
    username: comment.user?.username ?? "Unknown",
    content: comment.content,
    createdAt: comment.createdAt,
    canEdit: Boolean(userId && comment.user && String(userId) === String(comment.user._id)),
  }));

  return {
    id: String(post._id),
    title: post.title,
    content: post.content,
    categories,
    categoryLabels: categories
      .map((categoryId) => getValidCategoryIds(categoryId)?.label)
      .filter(Boolean),
    creatorUsername: post.creator?.username ?? "null",
    creatorId,
    hostHype: getTierPayload(hypeScore),
    createdAt: post.createdAt,
    totalVotes: post.votes,
    shares: post.shares ?? 0,
    comments: post.comments ?? 0,
    rsvpCount,
    hasRsvpd,
    rsvpUsers,
    commentList,
    userVote: userVote ? userVote.value : 0,
    canDelete,
    location: post.location ?? null,
    date: post.date ?? null,
    address: post.address ?? null,
    reportCount: post.reportCount ?? 0,
    moderationStatus: post.moderationStatus ?? "approved",
  };
}