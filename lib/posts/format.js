import { getTierPayload } from "@/lib/hype/tiers.js";

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
 * }}
 */
export function formatPost(post) {
    const hypeScore = post.creator?.hypeScore ?? 0;
    return {
        id: String(post._id),
        title: post.title,
        content: post.content,
        creatorUsername: post.creator?.username ?? "null",
        hostHype: getTierPayload(hypeScore),
        createdAt: post.createdAt,
    };
}