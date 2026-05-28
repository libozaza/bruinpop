"use client";
import { useState, useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher/pusher-client";
import HostCredibility from "@/components/HostCredibility";
import { combinedFeedRankScore } from "@/lib/hype";

const TIER_FILTERS = [
  { id: "all", label: "All hosts" },
  { id: "new_host", label: "New" },
  { id: "rising", label: "Rising" },
  { id: "established", label: "Established" },
  { id: "campus_favorite", label: "Favorite" },
];

const ACTIVE_TIER_STYLES = {
  all: "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900",
  new_host: "border-zinc-300 bg-zinc-200 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100",
  rising: "border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-700 dark:bg-sky-900/60 dark:text-sky-100",
  established:
    "border-violet-300 bg-violet-100 text-violet-900 dark:border-violet-700 dark:bg-violet-900/60 dark:text-violet-100",
  campus_favorite:
    "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-900/60 dark:text-amber-100",
};

export default function Feed() {
  const [posts, setPosts] = useState([]); 
  const [selectedTier, setSelectedTier] = useState("all");
  const channelRef = useRef(null);
  const subscribedRef = useRef(false);

  // Temporary rank blend until engagement-based scoring lands:
  // freshness (recency) + host trust boost from hype tier.
  function getPostBaseScore(createdAt) {
    const createdMs = new Date(createdAt).getTime();
    if (!Number.isFinite(createdMs)) return 0;
    const ageHours = (Date.now() - createdMs) / (1000 * 60 * 60);
    return Math.max(0, 200 - ageHours);
  }

  function scorePost(post) {
    const base = getPostBaseScore(post.createdAt);
    const hypeScore = post.hostHype?.hypeScore ?? 0;
    return combinedFeedRankScore(base, hypeScore);
  }

  function sortPostsByRank(postsList) {
    return [...postsList].sort((a, b) => {
      const scoreDiff = scorePost(b) - scorePost(a);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  // helper: merge + dedupe + sort (desc by rank)
  function mergeIncoming(prev, incoming) {
    if (prev.some((p) => p.id === incoming.id)) return prev;
    return sortPostsByRank([incoming, ...prev]);
  }

  // TODO: get new posts once you have scrolled to bottom of feed (infinite scroll)
  useEffect(() => {
    let mounted = true;

    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/posts");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setPosts(sortPostsByRank(data));
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      }
    };

    fetchPosts();

    const pusher = getPusherClient();
    if (!pusher) return () => { mounted = false; };

    // guard against double subscriptions
    if (subscribedRef.current) return () => { mounted = false; };
    subscribedRef.current = true;

    const channel = pusher.subscribe("posts");
    channelRef.current = channel;

    const handler = (incoming) => {
      // incoming format: { id, title, content, creatorUsername, createdAt }
      setPosts((prev) => mergeIncoming(prev, incoming));
    };

    channel.bind("post.created", handler);

    // refetch posts on reconnect to capture any missed events while disconnected
    const onStateChange = (states) => {
      if (states.current === "connected") {
        fetchPosts(); // resync missed events
      }
    };
    pusher.connection.bind("state_change", onStateChange);

    // cleanup on unmount
    return () => {
      mounted = false;
      if (channelRef.current) {
        channelRef.current.unbind("post.created", handler);
        try {
          pusher.unsubscribe("posts");
        } catch (e) {}
      }
      pusher.connection.unbind("state_change", onStateChange);
      subscribedRef.current = false;
    };
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (selectedTier === "all") return true;
    return post.hostHype?.tierId === selectedTier;
  });
  const tierCounts = posts.reduce(
    (acc, post) => {
      const tierId = post.hostHype?.tierId ?? "new_host";
      acc.all += 1;
      if (acc[tierId] !== undefined) acc[tierId] += 1;
      return acc;
    },
    {
      all: 0,
      new_host: 0,
      rising: 0,
      established: 0,
      campus_favorite: 0,
    },
  );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {TIER_FILTERS.map((filter) => {
                const active = selectedTier === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setSelectedTier(filter.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      active
                        ? ACTIVE_TIER_STYLES[filter.id] ?? ACTIVE_TIER_STYLES.all
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500"
                    }`}
                  >
                    {filter.label} ({tierCounts[filter.id] ?? 0})
                  </button>
                );
              })}
            </div>

            {filteredPosts.map((post, index) => (
                <article
                  key={post.id}
                  className="group rounded-[1.5rem] border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-sm font-semibold text-white shadow-sm">
                          {post.creatorUsername.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="space-y-1">
                          <HostCredibility
                            username={post.creatorUsername}
                            hypeScore={post.hostHype?.hypeScore ?? 0}
                          />
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Campus host · post #{index + 1}
                          </p>
                        </div>
                      </div>

                      <h3 className="max-w-xl text-lg font-semibold leading-7 text-zinc-950 dark:text-zinc-50">
                        {post.title}
                      </h3>
                      <p className="max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                        {post.content}
                      </p>
                    </div>

                    <div className="hidden rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 md:block">
                      Preview
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                    <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                    <span>Looks ready for likes, RSVP, and comments</span>
                  </div>
                </article>
            ))}
            {filteredPosts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                No posts match that trust tier yet.
              </div>
            ) : null}
        </div>
    );
}