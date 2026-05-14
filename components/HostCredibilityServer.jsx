import { getHostHypePublic } from "@/lib/hype/service";
import HostCredibility from "./HostCredibility";

/**
 * Server-only wrapper that fetches a host's hype payload by username and
 * renders the credibility badge. Use this from server components (feed
 * rows, post cards, profile headers) so callers don't have to thread
 * hypeScore through their own data layer.
 *
 * If the host doesn't exist (deleted user, dangling reference), renders
 * nothing rather than crashing -- consistent with getHostHypePublic
 * returning null.
 *
 * @param {Object} props
 * @param {string} props.username
 * @param {boolean} [props.showScore]
 * @param {string} [props.className]
 */
export default async function HostCredibilityServer({
  username,
  showScore = false,
  className = "",
}) {
  const payload = await getHostHypePublic(username);
  if (!payload) return null;
  return (
    <HostCredibility
      username={username}
      hypeScore={payload.hypeScore}
      showScore={showScore}
      className={className}
    />
  );
}
