"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ReportPostButton from "./ReportPost";
import { getPusherClient } from "@/lib/pusher/pusher-client";
import { combinedFeedRankScore } from "@/lib/hype";
import { TIER_DEFINITIONS } from "@/lib/hype/constants";
import { POST_CATEGORIES } from "@/lib/posts/categories";
import Post from "@/components/Post";

export default function Feed({
  initialCategoryFilters = [],
  initialHideReported = false,
  onFiltersChange,
}) {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState(
    Array.isArray(initialCategoryFilters) ? initialCategoryFilters : [],
  );
  const [hideReported, setHideReported] = useState(initialHideReported);
  const [trustTiers, setTrustTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeOverlayId, setActiveOverlayId] = useState(null);
  const channelRef = useRef(null);
  const subscribedRef = useRef(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (categories.length > 0) {
      params.set("categories", categories.join(","));
    }

    if (hideReported) {
      params.set("hideReported", "true");
    }

    const value = params.toString();
    return value ? `?${value}` : "";
  }, [categories, hideReported]);

  useEffect(() => {
    onFiltersChange?.({ categories, hideReported, queryString });
  }, [categories, hideReported, queryString, onFiltersChange]);

  function toggleCategory(categoryId) {
    setCategories((currentCategories) =>
      currentCategories.includes(categoryId)
        ? currentCategories.filter((id) => id !== categoryId)
        : [...currentCategories, categoryId],
    );
  }

  function clearCategoryFilters() {
    setCategories([]);
  }

  function toggleTrustTier(tierId) {
    setTrustTiers((current) =>
      current.includes(tierId)
        ? current.filter((id) => id !== tierId)
        : [...current, tierId],
    );
  }

  function clearTrustTierFilters() {
    setTrustTiers([]);
  }

  function clearAllFilters() {
    setCategories([]);
    setTrustTiers([]);
  }

  function getPostBaseScore(createdAt) {
    const createdMs = new Date(createdAt).getTime();

    if (!Number.isFinite(createdMs)) {
      return 0;
    }

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

      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function postMatchesCurrentFilters(post) {
    if (hideReported && (post.reportCount ?? 0) > 0) {
      return false;
    }

    if (categories.length > 0) {
      const postCategories = Array.isArray(post.categories) ? post.categories : [];

      if (!categories.every((category) => postCategories.includes(category))) {
        return false;
      }
    }

    if (trustTiers.length > 0) {
      const tierId = post.hostHype?.tierId ?? "new_host";
      if (!trustTiers.includes(tierId)) {
        return false;
      }
    }

    return true;
  }

  // GenAI-assisted (Cursor)
  // Prompt: On post.interaction_updated, refetch one post, merge, re-sort by combinedFeedRankScore, drop if filters fail.
  // Solution: refreshPostById → flatMap merge → sortPostsByRank; bound on existing Pusher channel cleanup.
  // Reflection: Full feed poll was too slow for badge/vote updates; I still created category filters and trust tier state separately.
  async function refreshPostById(postId) {
    try {
      const res = await fetch(`/api/posts/${postId}`);
      if (!res.ok) {
        return;
      }
      const updated = await res.json();
      setPosts((prev) => {
        const next = prev.flatMap((post) => {
          if (String(post.id) !== String(postId)) {
            return [post];
          }
          const merged = { ...post, ...updated };
          return postMatchesCurrentFilters(merged) ? [merged] : [];
        });
        return sortPostsByRank(
          hideReported
            ? next.filter((post) => (post.reportCount ?? 0) === 0)
            : next,
        );
      });
    } catch (err) {
      console.error("Failed to refresh post after interaction:", err);
    }
  }

  function mergeIncoming(prev, incoming) {
    if (!postMatchesCurrentFilters(incoming)) {
      return prev;
    }

    if (prev.some((post) => post.id === incoming.id)) {
      return prev;
    }

    return sortPostsByRank([incoming, ...prev]);
  }

  function handlePostClick(postId) {
    router.push(`/posts/${postId}`);
  }

  function handleReported(postId, data) {
    setPosts((currentPosts) => {
      const updatedPosts = currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              reportCount: data?.reportCount ?? (post.reportCount ?? 0) + 1,
              moderationStatus: data?.moderationStatus ?? post.moderationStatus,
            }
          : post,
      );

      return sortPostsByRank(
        hideReported
          ? updatedPosts.filter((post) => (post.reportCount ?? 0) === 0)
          : updatedPosts,
      );
    });
  }

  function optimisticDelete(postId) {
    setPosts((currentPosts) =>
      currentPosts.filter((post) => String(post.id) !== String(postId)),
    );
  }

  useEffect(() => {
    let mounted = true;
    let pollTimeoutId;

    const fetchPosts = async () => {
      try {
        setError("");

        const res = await fetch(`/api/posts${queryString}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch posts (${res.status})`);
        }

        const data = await res.json();

        if (!mounted) {
          return;
        }

        setPosts(sortPostsByRank(Array.isArray(data) ? data : []));
      } catch (err) {
        console.error("Failed to fetch posts:", err);

        if (mounted) {
          setError("Could not refresh posts. Please try again soon.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const pollPosts = async () => {
      await fetchPosts();

      if (mounted) {
        pollTimeoutId = setTimeout(pollPosts, 5000);
      }
    };

    setLoading(true);
    fetchPosts();

    const pusher = getPusherClient();

    if (!pusher) {
      pollTimeoutId = setTimeout(pollPosts, 5000);

      // cleanup function to clear the timeout when the component unmounts or filters change
      return () => {
        mounted = false;
        clearTimeout(pollTimeoutId);
      };
    }

    if (subscribedRef.current) {
      return () => {
        mounted = false;
      };
    }

    subscribedRef.current = true;

    const channel = pusher.subscribe("posts");
    channelRef.current = channel;

    const createdHandler = (incoming) => {
      setPosts((prev) => mergeIncoming(prev, incoming));
    };

    const deletedHandler = (incoming) => {
      if (!incoming?.postId) {
        return;
      }

      setPosts((prev) =>
        prev.filter((post) => String(post.id) !== String(incoming.postId)),
      );
    };

    const interactionHandler = (data) => {
      if (data?.postId) {
        refreshPostById(data.postId);
      }
    };

    channel.bind("post.created", createdHandler);
    channel.bind("post.deleted", deletedHandler);
    channel.bind("post.interaction_updated", interactionHandler);

    const onStateChange = (states) => {
      if (states.current === "connected") {
        fetchPosts();
      }
    };

    pusher.connection.bind("state_change", onStateChange);

    // cleanup function to clear the realtime subscription when the component unmounts or filters change
    return () => {
      mounted = false;

      if (channelRef.current) {
        channelRef.current.unbind("post.created", createdHandler);
        channelRef.current.unbind("post.deleted", deletedHandler);
        channelRef.current.unbind("post.interaction_updated", interactionHandler);

        try {
          pusher.unsubscribe("posts");
        } catch (e) {}
      }

      pusher.connection.unbind("state_change", onStateChange);
      subscribedRef.current = false;
    };
  }, [queryString, categories, hideReported, trustTiers]);

  // [GenAI Use]: Prompt: Set aside the JSX structure for the feed page in Feed.jsx. Build upon the React hooks I have written to fetch posts and render content using pusher.
  // Result is the structure in the return statement below
  // Reflection: The JSX structure and CSS looked pretty usable, but I had to reorder some components and drop some components for usability. Here, I wrote existing code to pull the post logic and only used GenAI to display the content nicely on the page.
  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/65">
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm transition hover:border-orange-200 hover:text-orange-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-orange-900 dark:hover:text-orange-200">
              <input
                type="checkbox"
                checked={hideReported}
                onChange={(e) => setHideReported(e.target.checked)}
                className="accent-orange-500"
              />
              Hide Reported Posts
            </label>

            {categories.length > 0 || trustTiers.length > 0 ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm transition hover:border-orange-200 hover:text-orange-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-orange-900 dark:hover:text-orange-200"
              >
                Clear filters
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Filter by category
            </p>

            <div className="flex flex-wrap gap-2">
              {POST_CATEGORIES.map((category) => {
                const selected = categories.includes(category.categoryId);

                return (
                  <button
                    key={category.categoryId}
                    type="button"
                    onClick={() => toggleCategory(category.categoryId)}
                    title={category.description}
                    className={[
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      selected
                        ? "border-orange-300 bg-orange-100 text-orange-700 shadow-sm dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-orange-200 hover:text-orange-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-orange-900 dark:hover:text-orange-200",
                    ].join(" ")}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/*
            GenAI-assisted (Cursor)
            Prompt: Multi-select chips from TIER_DEFINITIONS; AND with category filters via post.hostHype.tierId.
            Solution: trustTiers state + toggleTrustTier + map tier.shortLabel buttons (mirrors category chip styling).
            Reflection: Client-only filter for MVP; I may move this to GET /api/posts later—logic already in postMatchesCurrentFilters.
          */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Filter by host trust
            </p>

            <div className="flex flex-wrap gap-2">
              {TIER_DEFINITIONS.map((tier) => {
                const selected = trustTiers.includes(tier.id);

                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => toggleTrustTier(tier.id)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      selected
                        ? "border-orange-300 bg-orange-100 text-orange-700 shadow-sm dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-orange-200 hover:text-orange-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-orange-900 dark:hover:text-orange-200",
                    ].join(" ")}
                  >
                    {tier.shortLabel}
                  </button>
                );
              })}
            </div>

            {trustTiers.length > 0 ? (
              <button
                type="button"
                onClick={clearTrustTierFilters}
                className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-orange-700 hover:underline dark:text-zinc-400 dark:hover:text-orange-200"
              >
                Clear trust filters only
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/35 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {loading && posts.length === 0 ? (
        <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Loading posts…
        </div>
      ) : null}

      {!loading && posts.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-white/80 p-6 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            No posts match these filters yet.
          </p>

          <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Clear the category filters or publish a tagged post to populate this view.
          </p>
        </div>
      ) : null}

      <div className="relative isolate space-y-4">
        {posts.map((post, index) => (
          <div
            key={post.id}
            data-map-post-id={post.id}
            data-map-categories={(post.categories ?? []).join(",")}
            className={[
              "relative",
              activeOverlayId === post.id
                ? "z-50"
                : activeOverlayId
                  ? "pointer-events-none z-0"
                  : "z-0",
            ].join(" ")}
          >
            <Post
              post={post}
              index={index}
              handlePostClick={handlePostClick}
              onPostDeleted={optimisticDelete}
            />

            <div
              className="mt-2 flex justify-end"
              onClick={(event) => event.stopPropagation()}
            >
              <ReportPostButton
                postId={post.id}
                onReported={(data) => handleReported(post.id, data)}
                onOpenChange={(open) =>
                  setActiveOverlayId(open ? post.id : null)
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}