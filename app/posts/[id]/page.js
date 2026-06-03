"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReportPostButton from "@/components/ReportPost";

function formatPublishedAt(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function PostDetailPage() {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [rsvpError, setRsvpError] = useState("");
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const params = useParams();
  const postId = params?.id;

  useEffect(() => {
    if (!postId) {
      return;
    }

    let active = true;

    async function fetchPost() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/posts/${postId}`);

        if (!response.ok) {
          throw new Error(
            response.status === 404 ? "Post not found" : "Failed to load post",
          );
        }

        const data = await response.json();

        if (!active) {
          return;
        }

        setPost(data);
        setComments(data.commentList ?? []);
      } catch (fetchError) {
        if (!active) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load post",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchPost();

    return () => {
      active = false;
    };
  }, [postId]);

  async function handleCommentSubmit(event) {
    event.preventDefault();

    const trimmedContent = commentText.trim();

    if (!postId || !trimmedContent || commentLoading) {
      return;
    }

    try {
      setCommentLoading(true);
      setCommentError("");

      const response = await fetch(`/api/posts/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", content: trimmedContent }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to add comment");
      }

      const updatedPost = await response.json();

      setPost(updatedPost);
      setComments(updatedPost.commentList ?? []);
      setCommentText("");
    } catch (commentSubmitError) {
      setCommentError(
        commentSubmitError instanceof Error
          ? commentSubmitError.message
          : "Failed to add comment",
      );
    } finally {
      setCommentLoading(false);
    }
  }

  async function handleRsvpToggle() {
    if (!postId || !post || rsvpLoading) {
      return;
    }

    try {
      setRsvpLoading(true);
      setRsvpError("");

      const response = await fetch(`/api/posts/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: post.hasRsvpd ? "unrsvp" : "rsvp" }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to update RSVP");
      }

      const updatedPost = await response.json();

      setPost(updatedPost);
      setComments(updatedPost.commentList ?? []);
    } catch (rsvpSubmitError) {
      setRsvpError(
        rsvpSubmitError instanceof Error
          ? rsvpSubmitError.message
          : "Failed to update RSVP",
      );
    } finally {
      setRsvpLoading(false);
    }
  }

  function handleReported(data) {
    setPost((currentPost) => {
      if (!currentPost) {
        return currentPost;
      }

      return {
        ...currentPost,
        reportCount:
          data?.reportCount ?? (currentPost.reportCount ?? 0) + 1,
        moderationStatus:
          data?.moderationStatus ?? currentPost.moderationStatus,
      };
    });
  }

  const publishedAt = post ? formatPublishedAt(post.createdAt) : "";
  const creatorInitial = post?.creatorUsername?.charAt(0)?.toUpperCase() || "P";
  const categoryLabels = post?.categoryLabels ?? [];

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.14),_transparent_28%),radial-gradient(circle_at_right,_rgba(59,130,246,0.12),_transparent_22%),linear-gradient(180deg,_#fff7ed_0%,_#f8fafc_36%,_#ffffff_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.16),_transparent_24%),radial-gradient(circle_at_right,_rgba(59,130,246,0.12),_transparent_20%),linear-gradient(180deg,_#09090b_0%,_#111827_45%,_#09090b_100%)] sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Link
          href="/posts"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm transition hover:border-orange-200 hover:text-orange-700 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300 dark:hover:border-orange-900 dark:hover:text-orange-200"
        >
          ← Back to posts
        </Link>

        <header className="rounded-[2rem] border border-white/60 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/75 dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] lg:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 shadow-sm dark:border-orange-900/60 dark:bg-orange-950/70 dark:text-orange-200">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              BruinPop · single post
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Post detail
              </p>

              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                {loading ? "Loading post…" : post?.title ?? "Post not found"}
              </h1>

              <p className="max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-400 sm:text-base">
                {error ||
                  "A focused view for one campus post, with the host profile and trust tier surfaced alongside the content."}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                Author
              </p>
              <p className="mt-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {post ? `@${post.creatorUsername}` : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                Tier
              </p>
              <p className="mt-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {post ? post.hostHype.label : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                Published
              </p>
              <p className="mt-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {post ? publishedAt : "—"}
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <main className="space-y-6">
            {loading ? (
              <section className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Loading post…
                </p>
              </section>
            ) : post ? (
              <section className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80 lg:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-lg font-semibold text-white shadow-sm">
                      {creatorInitial}
                    </span>

                    <div>
                      <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        @{post.creatorUsername}
                      </p>

                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {post.hostHype.shortLabel} · {post.hostHype.hypeScore} hype · feed boost{" "}
                        {post.hostHype.feedBoost}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {publishedAt}
                      </p>
                    </div>
                  </div>

                  <div className="relative flex items-start justify-end gap-2">
                    {(post.reportCount ?? 0) > 0 ? (
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
                        Reported {post.reportCount}x
                      </span>
                    ) : null}

                    <ReportPostButton
                      postId={post.id}
                      onReported={handleReported}
                    />
                  </div>
                </div>

                {categoryLabels.length ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {categoryLabels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 dark:border-orange-900/70 dark:bg-orange-950/40 dark:text-orange-200"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-white/85 p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                    {post.content}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRsvpToggle}
                    disabled={rsvpLoading}
                    className={`rounded-full px-4 py-2 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                      post.hasRsvpd
                        ? "border border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-200 dark:hover:border-orange-800"
                        : "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                    }`}
                  >
                    {rsvpLoading ? "Saving..." : post.hasRsvpd ? "Cancel RSVP" : "RSVP"}
                  </button>

                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {post.rsvpCount ?? 0} people going
                  </span>
                </div>

                {rsvpError ? (
                  <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
                    {rsvpError}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-orange-200 hover:text-orange-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-orange-900 dark:hover:text-orange-200"
                  >
                    Reply soon
                  </button>

                  <button
                    type="button"
                    className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-orange-200 hover:text-orange-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-orange-900 dark:hover:text-orange-200"
                  >
                    Save post
                  </button>
                </div>
              </section>
            ) : (
              <section className="rounded-[2rem] border border-dashed border-zinc-300 bg-white/80 p-6 text-sm text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-950/80 dark:text-zinc-400">
                {error || "Post not found."}
              </section>
            )}

            <section className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80 lg:p-8">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    Comments
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                    {post ? `${post.comments ?? 0} total` : "—"}
                  </h2>
                </div>
              </div>

              {post ? (
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Write a comment..."
                    rows={4}
                    className="w-full rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-orange-800 dark:focus:ring-orange-950/40"
                  />

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Keep it short and useful.
                    </p>

                    <button
                      type="submit"
                      disabled={commentLoading || !commentText.trim()}
                      className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950"
                    >
                      {commentLoading ? "Posting..." : "Post comment"}
                    </button>
                  </div>
                </form>
              ) : null}

              {commentError ? (
                <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
                  {commentError}
                </p>
              ) : null}

              <div className="mt-5 space-y-3">
                {comments.length ? (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-[1.1rem] border border-zinc-200 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900/90"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                          @{comment.username}
                        </p>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {formatPublishedAt(comment.createdAt)}
                        </p>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {comment.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.1rem] border border-dashed border-zinc-300 bg-white/70 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-400">
                    No comments yet. Be the first to reply.
                  </div>
                )}
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Host credibility
              </p>

              <div className="mt-5 flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-lg font-semibold text-white shadow-sm">
                  {creatorInitial}
                </span>

                <div>
                  <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    {post ? `@${post.creatorUsername}` : "—"}
                  </p>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {post ? post.hostHype.label : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-200 bg-white/85 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                    Score
                  </p>

                  <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                    {post ? post.hostHype.hypeScore : "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white/85 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                    Boost
                  </p>

                  <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                    {post ? `+${post.hostHype.feedBoost}` : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.25rem] border border-zinc-200 bg-zinc-50/80 p-4 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400">
                <p>
                  This detail view keeps the focus on one post while still exposing the trust signal behind the host.
                </p>
                <p className="mt-2">
                  It is a clean foundation for future actions like comments, RSVPs, and sharing.
                </p>
              </div>

              <div className="mt-5 rounded-[1.25rem] border border-zinc-200 bg-white/85 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                      RSVP list
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {post ? `${post.rsvpCount ?? 0} RSVPs` : "—"}
                    </p>
                  </div>
                </div>

                {post?.canDelete ? (
                  <div className="mt-4 space-y-2">
                    {post.rsvpUsers?.length ? (
                      post.rsvpUsers.map((rsvpUser) => (
                        <div
                          key={`${rsvpUser.id}-${rsvpUser.createdAt ?? "rsvp"}`}
                          className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">
                            @{rsvpUser.username}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            Going
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                        No RSVPs yet.
                      </div>
                    )}
                  </div>
                ) : post?.hasRsvpd ? (
                  <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                    You are on the RSVP list.
                  </p>
                ) : null}
              </div>
            </section>

            {post ? (
              <section className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  Safety
                </p>

                <div className="mt-4 space-y-3">
                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    Report this post if it appears unsafe, misleading, spammy, or abusive.
                  </p>

                  <div className="relative">
                    <ReportPostButton
                      postId={post.id}
                      onReported={handleReported}
                    />
                  </div>
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}