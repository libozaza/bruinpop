// [GenAI Use] this is a preview page for the posts composer and feed created using GenAI. The PostComposer component is imported from components/PostComposer.jsx. The page is styled with Tailwind CSS and includes a header section with some info about the preview, as well as two main sections for composing a post and viewing the feed.

import PostComposer from "@/components/PostComposer";
import Feed from "@/components/Feed";

const MOCK_POSTS = [
  {
    id: 1,
    title: "CS35L study jam this Thursday",
    content:
      "We’re meeting in the labs at 6pm to work through the assignment together and share debugging tips.",
    creatorUsername: "acm",
    createdAt: "2026-05-08T18:30:00.000Z",
  },
  {
    id: 2,
    title: "New board game night",
    content:
      "Bring a friend, grab snacks, and vote on what we should play first. RSVP if you want a table spot.",
    creatorUsername: "bruinpop",
    createdAt: "2026-05-08T16:00:00.000Z",
  },
];

export const metadata = {
  title: "Posts preview · BruinPop",
  description: "Preview page for tagged posts, category filters, and basic safety reporting",
};

export default function PostsPreviewPage() {
  return (
    <div className="relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.14),_transparent_28%),radial-gradient(circle_at_right,_rgba(59,130,246,0.12),_transparent_22%),linear-gradient(180deg,_#fff7ed_0%,_#f8fafc_36%,_#ffffff_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.16),_transparent_24%),radial-gradient(circle_at_right,_rgba(59,130,246,0.12),_transparent_20%),linear-gradient(180deg,_#09090b_0%,_#111827_45%,_#09090b_100%)] sm:py-10">
      <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(255,255,255,0.55),transparent)] dark:bg-[linear-gradient(180deg,rgba(9,9,11,0.7),transparent)]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="grid gap-6 rounded-[2rem] border border-white/60 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/75 dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] lg:grid-cols-[1.4fr_0.9fr] lg:items-end lg:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 shadow-sm dark:border-orange-900/60 dark:bg-orange-950/70 dark:text-orange-200">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              BruinPop · posts preview
            </div>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                Campus posts with tags and filters.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400 sm:text-base">
                This preview pairs the post composer with reusable category filters and reporting controls,
                so the same post data can power both the feed and the future campus map.
              </p>
            </div>
          </div>

        </header>

        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[1.75rem] border border-white/60 bg-white/80 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80 dark:shadow-[0_18px_48px_rgba(0,0,0,0.35)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  Compose
                </p>
                <h2 className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                  Start a tagged post
                </h2>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                Preview only
              </span>
            </div>

            <PostComposer />
          </section>

          <section className="rounded-[1.75rem] border border-white/60 bg-white/80 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80 dark:shadow-[0_18px_48px_rgba(0,0,0,0.35)] sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  Feed
                </p>
                <h2 className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                  Latest filtered posts
                </h2>
              </div>

              <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                Updated now
              </div>
            </div>

            <Feed />
          </section>
        </div>
      </div>
    </div>
  );
}