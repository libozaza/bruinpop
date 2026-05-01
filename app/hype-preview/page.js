import HostCredibility from "@/components/HostCredibility";
import { combinedFeedRankScore, getTierPayload } from "@/lib/hype";

const MOCK_HOSTS = [
  { username: "bruin_bakes", hypeScore: 0 },
  { username: "cs_club", hypeScore: 24 },
  { username: "kerck_pizza", hypeScore: 75 },
  { username: "ucla_esports", hypeScore: 310 },
];

export const metadata = {
  title: "Hype / trust preview · BruinPop",
  description: "Dev preview for host credibility UI and tier helpers.",
};

export default function HypePreviewPage() {
  const sampleBase = 100;
  return (
    <div className="min-h-full bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto max-w-lg space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            BruinPop · trust / hype
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Host credibility preview
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Map and feed can render{" "}
            <code className="rounded bg-zinc-200/80 px-1 py-0.5 text-xs dark:bg-zinc-800">
              HostCredibility
            </code>{" "}
            with the host&apos;s username and hype score once posts exist.
          </p>
        </header>

        <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Example hosts
          </h2>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {MOCK_HOSTS.map((h) => (
              <li key={h.username} className="py-3 first:pt-0 last:pb-0">
                <HostCredibility username={h.username} hypeScore={h.hypeScore} showScore />
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            API-shaped payload (for future GET /users or embedded on posts)
          </h2>
          <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
            {MOCK_HOSTS.map((h) => {
              const payload = getTierPayload(h.hypeScore);
              const rank = combinedFeedRankScore(sampleBase, h.hypeScore);
              return (
                <li key={`${h.username}-payload`}>
                  <span className="font-medium">{h.username}</span>
                  <pre className="mt-1 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
                    {JSON.stringify({ ...payload, sampleFeedRank: rank }, null, 2)}
                  </pre>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
