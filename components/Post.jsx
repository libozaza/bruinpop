"use client";

import { useState, useEffect } from "react";
import { getPusherClient } from "@/lib/pusher/pusher-client";
import HostCredibility from "@/components/HostCredibility";

export default function Post({ post, index, handlePostClick }) {
  const [localPost, setLocalPost] = useState(post);
  const [voteLoading, setVoteLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpError, setRsvpError] = useState("");

  async function handleVote(postId, action) {
    setVoteLoading(true);

    try {
      await fetch(`/api/posts/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
    } finally {
      setVoteLoading(false);
    }
  }

  async function handleShare(postId) {
    // prevent article click
    try {
      const shareUrl = `${location.origin}/posts/${postId}`;
      await navigator.clipboard.writeText(shareUrl);

      // optimistically update UI
      setLocalPost((prev) => ({
        ...prev,
        shares: (prev.shares ?? 0) + 1,
      }));

      setShareStatus("Copied!");
      setTimeout(() => setShareStatus(""), 1500);

      // notify backend (swallow errors)
      try {
        await fetch(`/api/posts/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "share" }),
        });
      } catch (err) {
        console.error("Failed to notify backend of share:", err);
      }
    } catch (err) {
      console.error("Share failed:", err);
      setShareStatus("Failed");
      setTimeout(() => setShareStatus(""), 1500);
    }
  }

  async function handleDelete(postId) {
    const confirmed = window.confirm("Delete this post? This cannot be undone.");

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to delete post");
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
      setDeleteError(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      setDeleting(false);
    }
  }

  async function handleComment(postId) {
    const trimmedComment = commentText.trim();

    if (!trimmedComment || commentLoading) {
      return;
    }

    setCommentLoading(true);
    setCommentError("");

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", content: trimmedComment }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to add comment");
      }

      const updatedPost = await response.json();
      setLocalPost(updatedPost);
      setCommentText("");
    } catch (err) {
      console.error("Failed to add comment:", err);
      setCommentError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  }

  async function handleRsvp(postId) {
    if (rsvpLoading) {
      return;
    }

    setRsvpLoading(true);
    setRsvpError("");

    const action = localPost.hasRsvpd ? "unrsvp" : "rsvp";

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to update RSVP");
      }

      const updatedPost = await response.json();
      setLocalPost(updatedPost);
    } catch (err) {
      console.error("Failed to update RSVP:", err);
      setRsvpError(err instanceof Error ? err.message : "Failed to update RSVP");
    } finally {
      setRsvpLoading(false);
    }
  }

  async function handleEdit(postId) {
    if(editTitle.trim().length < 5){
      setEditError("Title must be at least 5 characters");
      return;
    }

    if (editTitle.trim().length > 100) {
      setEditError("Title cannot exceed 100 characters");
      return;
    }
    if (editContent.trim().length > 1000) {
      setEditError("Content cannot exceed 1000 characters");
      return;
    }
    setEditLoading(true);
    setEditError("");

    try{
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), content: editContent.trim() }),
      });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error || "Failed to edit post");
    }

    const updatedPost = await response.json();
    setLocalPost(updatedPost);
    setEditing(false);
      
    } catch (err) {
      console.error("Failed to edit post:", err);
      setEditError("Failed to edit post");
    } finally {
      setEditLoading(false);
    }

  }

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  useEffect(() => {
    const pusher = getPusherClient();

    if (!pusher) {
      return;
    }

    const channel = pusher.subscribe("posts");

    const handler = async (data) => {
      if (!data?.postId) {
        return;
      }

      if (String(data.postId) !== String(post.id)) {
        return;
      }

      try {
        const res = await fetch(`/api/posts/${post.id}`);

        if (!res.ok) {
          return;
        }

        const updated = await res.json();
        setLocalPost(updated);
      } catch (err) {
        console.error("Failed to fetch updated post:", err);
      }
    };

    channel.bind("post.interaction_updated", handler);
    channel.bind("post.deleted", handler);
    channel.bind("post.updated", handler);

    return () => {
      try {
        channel.unbind("post.interaction_updated", handler);
        channel.unbind("post.deleted", handler);
        channel.unbind("post.updated", handler);
      } catch (e) {}
    };
  }, [post.id]);

  return (
    <article
      onClick={() => handlePostClick(post.id)}
      data-map-post-id={post.id}
      data-map-categories={(localPost.categories ?? []).join(",")}
      className="group cursor-pointer rounded-[1.5rem] border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-sm font-semibold text-white shadow-sm">
              {(localPost.creatorUsername || "?").slice(0, 1).toUpperCase()}
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                @{localPost.creatorUsername}
              </p>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Campus host · post #{index + 1}
              </p>
            </div>
          </div>

          <HostCredibility hostHype={localPost.hostHype} />

          {localPost.date ? (
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="font-medium">When:</span>
                <span>{new Date(localPost.date).toLocaleString()}</span>
              </div>

              {localPost.address ? (
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-medium">Where:</span>
                  <span className="truncate">{localPost.address}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {localPost.categoryLabels?.length ? (
            <div className="flex flex-wrap gap-2">
              {localPost.categoryLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 dark:border-orange-900/70 dark:bg-orange-950/40 dark:text-orange-200"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}

          {editing ? (
            <div
              className="space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={100}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={1000}
                rows={4}
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
              {editError ? (
                <p className="text-xs text-rose-600 dark:text-rose-400">{editError}</p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleEdit(localPost.id)}
                  disabled={editLoading}
                  className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950"
                >
                  {editLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold leading-7 text-zinc-950 dark:text-zinc-50">
                {localPost.title}
              </h3>
              <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                {localPost.content}
              </p>
            </>
          )}
        </div>

        <div
          className="flex flex-col items-end gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();

                if (!voteLoading) {
                  handleVote(localPost.id, "upvote");
                }
              }}
              className={`text-xl ${
                localPost.userVote === 1 ? "text-emerald-600" : "text-zinc-400"
              }`}
              aria-label="Upvote"
            >
              ▲
            </button>

            <span>{localPost.totalVotes ?? 0}</span>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();

                if (!voteLoading) {
                  handleVote(localPost.id, "downvote");
                }
              }}
              className={`text-xl ${
                localPost.userVote === -1 ? "text-rose-600" : "text-zinc-400"
              }`}
              aria-label="Downvote"
            >
              ▼
            </button>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleRsvp(localPost.id);
            }}
            disabled={rsvpLoading}
            className={`rounded-full px-3 py-1 text-sm font-medium transition disabled:opacity-50 ${
              localPost.hasRsvpd
                ? "border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-200"
                : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            }`}
          >
            {rsvpLoading ? "Saving..." : localPost.hasRsvpd ? "Cancel RSVP" : "RSVP"}
          </button>

          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {localPost.rsvpCount ?? 0} RSVPs
          </span>

          {rsvpError ? (
            <p className="max-w-36 text-right text-xs text-rose-600 dark:text-rose-400">
              {rsvpError}
            </p>
          ) : null}

          <div className="hidden rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 md:block">
            Preview
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleShare(localPost.id);
            }}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            {shareStatus || "Share"}
          </button>

          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {localPost.shares ?? 0} shares
          </span>

          {localPost.canDelete ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setEditTitle(localPost.title);
                  setEditContent(localPost.content);
                  setEditError("");
                  setEditing(true);
                }}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                Edit
              </button>
              
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();

                  if (!deleting) {
                    handleDelete(localPost.id);
                  }
                }}
                className="rounded-md border border-rose-200 bg-white px-3 py-1 text-sm text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:bg-zinc-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                aria-label="Delete post"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>

              {deleteError ? (
                <p className="max-w-36 text-right text-xs text-rose-600 dark:text-rose-400">
                  {deleteError}
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div
        className="mt-5 space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800"
        onClick={(event) => event.stopPropagation()}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleComment(localPost.id);
          }}
          className="flex gap-2"
        >
          <input
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onFocus={(event) => event.stopPropagation()}
            placeholder="Write a comment..."
            className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-orange-800 dark:focus:ring-orange-950/40"
          />

          <button
            type="submit"
            disabled={commentLoading || !commentText.trim()}
            className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950"
          >
            {commentLoading ? "Posting..." : "Comment"}
          </button>
        </form>

        {commentError ? (
          <p className="text-xs text-rose-600 dark:text-rose-400">
            {commentError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{new Date(localPost.createdAt).toLocaleString()}</span>
          <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <span>{localPost.comments ?? 0} comments</span>
        </div>
      </div>
    </article>
  );
}