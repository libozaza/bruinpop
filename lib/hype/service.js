import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getHostHypeDelta } from "./engagement";
import { getTierPayload } from "./tiers";

/**
 * Server-only persistence layer for the hype/trust system. Crosses the
 * pure-helpers boundary by talking to Mongo, so it must NOT be imported
 * into client components. (It is intentionally not re-exported from
 * lib/hype/index.js for that reason.)
 */

/**
 * Atomically apply an engagement's hype delta to the host user and return
 * their new public trust payload.
 *
 * Call this from an engagement handler AFTER the engagement row has been
 * persisted by its owning service (likes, rsvps, comments, etc.). This
 * function does NOT de-duplicate -- the Engagement collection's unique
 * (user, post, kind) index is the source of truth for "did this user
 * already do this action?". If a caller fires this twice, hype will move
 * twice.
 *
 * Why an aggregation pipeline instead of $inc?
 *   We need (current + delta) clamped at >= 0 in a single atomic write.
 *   A plain $inc can drive hypeScore negative on a downvote against a
 *   zero-scored host; a read-then-write would race against concurrent
 *   engagements. The pipeline form lets us express "max(0, current + d)"
 *   as one server-side operation. Requires MongoDB 4.2+ (Atlas is 6+, fine).
 *
 * @param {Object} args
 * @param {string|import('mongoose').Types.ObjectId} args.hostId  _id of the post's creator
 * @param {import('./engagement').EngagementKind} args.kind
 * @returns {Promise<import('./tiers').HostHypePayload>}
 */
export async function recordHostEngagement({ hostId, kind }) {
  if (!hostId) {
    throw new Error("recordHostEngagement: hostId is required");
  }
  const delta = getHostHypeDelta(kind);

  await connectDB();
  const updated = await User.findOneAndUpdate(
    { _id: hostId },
    [
      {
        $set: {
          hypeScore: {
            $max: [
              0,
              { $add: [{ $ifNull: ["$hypeScore", 0] }, delta] },
            ],
          },
        },
      },
    ],
    { new: true, projection: { hypeScore: 1 } },
  );

  if (!updated) {
    throw new Error(`recordHostEngagement: no user with _id ${String(hostId)}`);
  }
  return getTierPayload(updated.hypeScore);
}

/**
 * Read a host's public trust payload by username. Returns null for missing
 * users -- callers (feed enrichment, profile cards) should treat a missing
 * host as "no badge" rather than an error, since hosts can be deleted while
 * their posts are still referenced.
 *
 * @param {string} username
 * @returns {Promise<import('./tiers').HostHypePayload | null>}
 */
export async function getHostHypePublic(username) {
  if (!username) return null;
  await connectDB();
  const user = await User.findOne(
    { username },
    { hypeScore: 1 },
  ).lean();
  if (!user) return null;
  return getTierPayload(user.hypeScore ?? 0);
}
