import { getTierPayload } from "@/lib/hype/tiers.js";
import Vote from "@/lib/models/Vote";
import { getToken } from "next-auth/jwt";

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
 * @returns {{
 *   id: string,
 *   title: string,
 *   content: string,
 *   creatorUsername: string,
 *   hostHype: import('@/lib/hype/tiers.js').HostHypePayload,
 *   createdAt: string | Date,
 *   upvotes: number,
 *   downvotes: number,
 * }}
 */
export async function formatPost(post) {
    const token = await getToken();
    const userId = token?.id;
    const hypeScore = post.creator?.hypeScore ?? 0;
    const votes = await Vote.find({ post: post._id });
    const upvotes = votes.filter(vote => vote.value === 1).length;
    const downvotes = votes.filter(vote => vote.value === -1).length;
    const userVote = votes.find(vote => String(vote.user) === String(userId));

    return {
        id: String(post._id),
        title: post.title,
        content: post.content,
        creatorUsername: post.creator?.username ?? "null",
        hostHype: getTierPayload(hypeScore),
        createdAt: post.createdAt,
        upvotes: upvotes,
        downvotes: downvotes,
        userVote: userVote ? userVote.value : 0,
    };
}