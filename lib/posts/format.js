import { getTierPayload } from "@/lib/hype/tiers.js";
import Vote from "@/lib/models/Vote";

/**
 * @typedef {Object} FormatPostInput
 * @property {string|import('mongoose').Types.ObjectId} _id
 * @property {string} title
 * @property {string} content
 * @property {{ username?: string, hypeScore?: number } | null | undefined} creator
 * @property {string | Date} createdAt
 * @property {Array<{
 *   _id: string|import('mongoose').Types.ObjectId,
 *   content: string,
 *   createdAt: string | Date,
 *   user?: { username?: string } | null | undefined,
 * }>} [comments]
 */

/**
 * Convert a persisted post document into the public API shape used by the feed.
 * Assumes that the caller connects to the database and populates the post's creator field to include at least username and hypeScore.
 *
 * The input should match the Post schema in [lib/models/Post.js](lib/models/Post.js),
 * with `creator` populated to include at least `username` and `hypeScore`.
 *
 * @param {FormatPostInput} post
 * @param {Object} [token] - used to get userId and creator
 * @param {Array<{
 *   _id: string|import('mongoose').Types.ObjectId,
 *   content: string,
 *   createdAt: string | Date,
 *   user?: { username?: string } | null | undefined,
 * }>} [comments=[]]
 * @returns {{
 *   id: string,
 *   title: string,
 *   content: string,
 *   creatorUsername: string,
 *   creatorId: string | null,
 *   hostHype: import('@/lib/hype/tiers.js').HostHypePayload,
 *   createdAt: string | Date,
 *   totalVotes: number,
 *   userVote: number, // 1 for upvote, -1 for downvote, 0 for no vote
 *   canDelete: boolean,
 *   comments: number,
 *   commentList: Array<{
 *     id: string,
 *     username: string,
 *     content: string,
 *     createdAt: string | Date,
 *   }>,
 * }}
 */
export async function formatPost(post, token, comments = []) {
    const userId = token?.id;
    const hypeScore = post.creator?.hypeScore ?? 0;
    const votes = await Vote.find({ post: post._id });
    const userVote = votes.find(vote => String(vote.user) === String(userId));
    const creatorId = post.creator?._id ? String(post.creator._id) : null;
    const canDelete = Boolean(userId && creatorId && String(userId) === creatorId);
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
    };
}