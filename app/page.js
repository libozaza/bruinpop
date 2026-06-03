import Link from "next/link";
import Feed from "@/components/Feed";

export const metadata = {
  title: "BruinPop · Find what's popping at UCLA",
  description: "Campus events, pop-ups, and hosted gatherings at UCLA — all in one place.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 flex flex-col lg:flex-row gap-16 items-start">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 mb-6">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Live on campus
          </div>
          <h1 className="text-5xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight mb-5">
            Find what's popping<br />at UCLA
          </h1>
          <p className="text-base text-zinc-500 dark:text-zinc-400 leading-7 max-w-md mb-8">
            Campus events, pop-ups, and hosted gatherings — all in one place. Discover what's happening near you right now.
          </p>
          <div className="flex gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Sign up now
            </Link>
            <Link
              href="/posts"
              className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:border-zinc-300 transition dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              Browse the map
            </Link>
          </div>
        </div>

        {/* Feed preview */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Live feed
              </p>
            </div>
            <div className="max-h-[480px] overflow-y-auto bg-white dark:bg-zinc-950 p-3">
              <Feed />
            </div>
          </div>
        </div>
      </section>

      <hr className="border-zinc-100 dark:border-zinc-900" />

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { icon: "📍", title: "Map view", desc: "See all active events on the UCLA campus map in real time." },
          { icon: "🔥", title: "Hype system", desc: "Hosts earn hype through engagement, pushing their events higher in the feed." },
          { icon: "⚡", title: "Live updates", desc: "Posts, votes, and comments update instantly across all users." },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900">
            <div className="text-2xl mb-3">{icon}</div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">{title}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-6">{desc}</p>
          </div>
        ))}
      </section>

      <hr className="border-zinc-100 dark:border-zinc-900" />

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50 mb-4">
          Ready to find your next pop-up?
        </h2>
        <p className="text-base text-zinc-500 dark:text-zinc-400 mb-8">
          Create an account to post events, vote, and comment.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/signup"
            className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition dark:bg-zinc-50 dark:text-zinc-950"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:border-zinc-300 transition dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            Log in
          </Link>
        </div>
      </section>

    </main>
  );
}