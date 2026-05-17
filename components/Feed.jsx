"use client";
import { useMemo, useState, useEffect } from "react";
import CategoryPicker from "./CategoryPicker";
import ReportPostButton from "./ReportPost";

export default function Feed({
  initialCategoryFilters = [],
  initialHideReported = false,
  onFiltersChange,
}) {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState(initialCategoryFilters);
  const [hideReported, setHideReported] = useState(initialHideReported);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // currently polls every 5 seconds. TODO: consider using WebSockets or Server-Sent Events for real-time updates instead of polling
  useEffect(() => {
    let timeoutId;
    let cancelled = false;

    const fetchPosts = async () => {
      try {
        setError("");
        const res = await fetch(`/api/posts${queryString}`);
        if (!res.ok) throw new Error(`Failed to fetch posts (${res.status})`);
        const data = await res.json();
        if (!cancelled) setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        if (!cancelled) setError("Could not refresh posts. Please try again soon.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          timeoutId = setTimeout(fetchPosts, 5000);
        }
      }
    };

    setLoading(true);
    fetchPosts();

    // cleanup function to clear the timeout when the component unmounts or filters change
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [queryString]);

  function handleReported(postId, data) {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              reportCount: data?.reportCount ?? (post.reportCount ?? 0) + 1,
              moderationStatus: data?.moderationStatus ?? post.moderationStatus,
            }
          : post,
      ),
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/65">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Map-ready filters
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              These filters call the posts API with query params, so the future map can reuse the same filter state for visible pins and popups.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm transition hover:border-orange-200 hover:text-orange-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-orange-900 dark:hover:text-orange-200">
            <input
              type="checkbox"
              checked={hideReported}
              onChange={(e) => setHideReported(e.target.checked)}
              className="accent-orange-500"
            />
            Hide reported posts
          </label>
        </div>

        <CategoryPicker selected={categories} onChange={setCategories} mode="filter" />
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

      <div className="space-y-4">
        {posts.map((post, index) => (
          <article
            key={post.id}
            data-map-post-id={post.id}
            data-map-categories={(post.categories ?? []).join(",")}
            className="group rounded-[1.5rem] border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-sm font-semibold text-white shadow-sm">
                    {(post.creatorUsername || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      @{post.creatorUsername}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Campus host · post #{index + 1}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(post.categoryLabels?.length ? post.categoryLabels : ["Uncategorized"]).map(
                    (label) => (
                      <span
                        key={label}
                        className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 dark:border-orange-900/70 dark:bg-orange-950/40 dark:text-orange-200"
                      >
                        {label}
                      </span>
                    ),
                  )}
                  {(post.reportCount ?? 0) > 0 ? (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
                      Reported
                    </span>
                  ) : null}
                </div>

                <h3 className="max-w-xl text-lg font-semibold leading-7 text-zinc-950 dark:text-zinc-50">
                  {post.title}
                </h3>
                <p className="max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                  {post.content}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="hidden rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 md:block">
                  Preview
                </div>
                <ReportPostButton postId={post.id} onReported={(data) => handleReported(post.id, data)} />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <span>{new Date(post.createdAt).toLocaleString()}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              <span>Ready for feed cards now and map popups later</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

