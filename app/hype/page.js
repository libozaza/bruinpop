import Link from "next/link";
import HostCredibility from "@/components/HostCredibility";
import { getTopHostsByHype } from "@/lib/hype/service";

export const metadata = {
  title: "Host leaderboard — BruinPop",
};

export default async function HypeLeaderboardPage() {
  const hosts = await getTopHostsByHype({ limit: 25 });

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-12">
      <Link
        href="/posts"
        className="text-sm text-zinc-500 hover:text-orange-700 dark:hover:text-orange-200"
      >
        ← Back to feed
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Campus host leaderboard
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Hosts earn hype when others like, RSVP, share, or comment on their events.
        Tiers boost how high new posts rank in the feed.
      </p>

      <ol className="mt-8 space-y-3">
        {hosts.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No hosts with hype yet. Engage with events to get started.
          </li>
        ) : (
          hosts.map((entry, index) => (
            <li
              key={entry.username}
              className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="w-8 shrink-0 text-sm font-semibold text-zinc-400">
                {index + 1}
              </span>
              <Link
                href={`/profile/${entry.username}`}
                className="min-w-0 flex-1 hover:underline"
              >
                <HostCredibility
                  username={entry.username}
                  hostHype={entry.hype}
                  showScore
                />
              </Link>
            </li>
          ))
        )}
      </ol>
    </main>
  );
}
