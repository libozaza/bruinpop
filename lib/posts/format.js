import { getTierPayload } from "@/lib/hype/tiers.js";
import Vote from "@/lib/models/Vote";

/**
 * @typedef {Object} FormatPostInput
 * @property {string|import('mongoose').Types.ObjectId} _id
 * @property {string} title
 * @property {string} content
 * @property {{ username?: string, hypeScore?: number } | null | undefined} creator
 * @property {string | Date} createdAt
 */

/**
 * Convert a persisted post document into the public API shape used by the feed.
 * Assumes that the caller connects to the database and populates the post's creator field to include at least username and hypeScore.
 *
 * The input should match the Post schema in [lib/models/Post.js](lib/models/Post.js),
 * with `creator` populated to include at least `username` and `hypeScore`.
 *
 * @param {FormatPostInput} post
 * @param {Object} [token] - optional NextAuth token object (pass to avoid calling getToken here)
 * @returns {{
 *   id: string,
 *   title: string,
 *   content: string,
 *   creatorUsername: string,
 *   hostHype: import('@/lib/hype/tiers.js').HostHypePayload,
 *   createdAt: string | Date,
 *   totalVotes: number,
 *   userVote: number, // 1 for upvote, -1 for downvote, 0 for no vote
 * }}
 */
export async function formatPost(post, token) {
    const userId = token?.id;
    const hypeScore = post.creator?.hypeScore ?? 0;
    const votes = await Vote.find({ post: post._id });
    const userVote = votes.find(vote => String(vote.user) === String(userId));

    return {
        id: String(post._id),
        title: post.title,
        content: post.content,
        creatorUsername: post.creator?.username ?? "null",
        hostHype: getTierPayload(hypeScore),
        createdAt: post.createdAt,
        totalVotes: post.votes,
        userVote: userVote ? userVote.value : 0,
    };
}