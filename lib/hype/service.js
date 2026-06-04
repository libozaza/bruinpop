import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getHostHypeDelta } from "./engagement.js";
import { sumHostHypeDeltas } from "./interaction-deltas.js";
import { getTierPayload } from "./tiers.js";

/**
 * Server-only persistence layer for the hype/trust system. Crosses the
 * pure helpers boundary by talking to Mongo, so it must NOT be imported
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
    { new: true, projection: { hypeScore: 1 }, updatePipeline: true },
  );

  if (!updated) {
    throw new Error(`recordHostEngagement: no user with _id ${String(hostId)}`);
  }
  return getTierPayload(updated.hypeScore);
}

/**
 * Apply one or more engagement kinds in a single atomic update (e.g. vote
 * switch: undownvote + like). Skips the DB write when the net delta is 0.
 *
 * @param {Object} args
 * @param {string|import('mongoose').Types.ObjectId} args.hostId
 * @param {import('./engagement').EngagementKind[]} args.kinds
 * @returns {Promise<import('./tiers').HostHypePayload | null>}
 */
export async function recordHostEngagements({ hostId, kinds }) {
  if (!hostId || !Array.isArray(kinds) || kinds.length === 0) {
    return null;
  }

  const delta = sumHostHypeDeltas(kinds);
  if (delta === 0) {
    await connectDB();
    const user = await User.findById(hostId, { hypeScore: 1 }).lean();
    if (!user) return null;
    return getTierPayload(user.hypeScore ?? 0);
  }

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
    { new: true, projection: { hypeScore: 1 }, updatePipeline: true },
  );

  if (!updated) {
    throw new Error(`recordHostEngagements: no user with _id ${String(hostId)}`);
  }
  return getTierPayload(updated.hypeScore);
}

/**
 * Read a host's public trust payload by username. Returns null for missing
 * users, callers (feed enrichment, profile cards) should treat a missing
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

/**
 * @typedef {Object} LeaderboardEntry
 * @property {string} username
 * @property {import('./tiers').HostHypePayload} hype
 */

/**
 * Top hosts by hypeScore, descending. Useful for "trending hosts" widgets
 * or admin dashboards. The hypeScore index on User makes this an O(limit)
 * read in practice.
 *
 * @param {Object} [args]
 * @param {number} [args.limit=20]  hard-capped at 100 to keep payload bounded
 * @returns {Promise<LeaderboardEntry[]>}
 */
export async function getTopHostsByHype({ limit = 20 } = {}) {
  const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? limit : 20, 1), 100);
  await connectDB();
  const rows = await User.find(
    {},
    { username: 1, hypeScore: 1 },
  )
    .sort({ hypeScore: -1, _id: 1 })
    .limit(safeLimit)
    .lean();
  return rows.map((u) => ({
    username: u.username,
    hype: getTierPayload(u.hypeScore ?? 0),
  }));
}

/**
 * Multiplicative time decay over the entire user collection.
 *
 * We $floor the result so hypeScore stays a nonneg integer per the User
 * schema contract; otherwise repeated decays would create irrational
 * fractional scores that surprise the UI.
 *
 * @param {Object} [args]
 * @param {number} [args.factor=0.98]  multiplier in (0, 1]; 0.98 ≈ 2% nightly
 * @returns {Promise<{ matched: number, modified: number, factor: number }>}
 */
export async function applyHypeDecay({ factor = 0.98 } = {}) {
  if (!Number.isFinite(factor) || factor <= 0 || factor > 1) {
    throw new Error(
      `applyHypeDecay: factor must be in (0, 1], got ${factor}`,
    );
  }
  await connectDB();
  const result = await User.updateMany(
    { hypeScore: { $gt: 0 } },
    [
      {
        $set: {
          hypeScore: {
            $max: [0, { $floor: { $multiply: ["$hypeScore", factor] } }],
          },
        },
      },
    ],
    { updatePipeline: true },
  );
  return {
    matched: result.matchedCount ?? 0,
    modified: result.modifiedCount ?? 0,
    factor,
  };
}
