import { computeTier } from "@/lib/hype/tiers";

/**
 * Trust / hype indicator for map cards, feed rows, and post detail.
 *
 * @param {Object} props
 * @param {string} props.username
 * @param {number} props.hypeScore  Host’s aggregate hype (default 0 for new accounts).
 * @param {boolean} [props.showScore]
 * @param {string} [props.className]
 */
export default function HostCredibility({
  username,
  hypeScore = 0,
  showScore = false,
  className = "",
}) {
  const tier = computeTier(hypeScore);
  const safeScore = Number.isFinite(hypeScore) ? Math.max(0, hypeScore) : 0;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 text-sm ${className}`.trim()}
      title={`${tier.label} · Hype reflects engagement on this host’s events (likes, RSVPs, and more).`}
    >
      <span className="font-medium text-zinc-900 dark:text-zinc-100">{username}</span>
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tier.badgeClass}`}
      >
        {tier.shortLabel}
      </span>
      {showScore ? (
        <span className="tabular-nums text-zinc-500 dark:text-zinc-400">{safeScore} hype</span>
      ) : null}
    </div>
  );
}
