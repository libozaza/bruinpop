import { getTierPayload } from "@/lib/hype/tiers.js";
import Vote from "@/lib/models/Vote";
import { getValidCategoryIds } from "@/lib/posts/categories";

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
 */
export async function formatPost(post, token, comments = []) {
  const userId = token?.id;
  const hypeScore = post.creator?.hypeScore ?? 0;
  const votes = await Vote.find({ post: post._id });
  const userVote = votes.find((vote) => String(vote.user) === String(userId));
  const creatorId = post.creator?._id ? String(post.creator._id) : null;
  const canDelete = Boolean(userId && creatorId && String(userId) === creatorId);
  const categories = Array.isArray(post.categories) ? post.categories : [];

  const commentList = comments.map((comment) => ({
    id: String(comment._id),
    username: comment.user?.username ?? "Unknown",
    content: comment.content,
    createdAt: comment.createdAt,
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
    commentList,
    userVote: userVote ? userVote.value : 0,
    canDelete,
    location: post.location ?? null,
    reportCount: post.reportCount ?? 0,
    moderationStatus: post.moderationStatus ?? "approved",
  };
}