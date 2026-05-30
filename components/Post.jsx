"use client";
import { useState, useEffect } from "react";
import { getPusherClient } from "@/lib/pusher/pusher-client";
import HostCredibility from "@/components/HostCredibility";

export default function Post({ post, index, handlePostClick }) {
    const [localPost, setLocalPost] = useState(post);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [shareStatus, setShareStatus] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [commentText, setCommentText] = useState("");
    const [commentError, setCommentError] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);

    async function handleUpvote(postId) {
        setLoading(true);
        try {
            await fetch(`/api/posts/${postId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "upvote" }),
            });
        } catch (err) {
            console.error("Failed to upvote:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDownvote(postId) {
        setLoading(true);
        try {
            await fetch(`/api/posts/${postId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "downvote" }),
            });
        } catch (err) {
            console.error("Failed to downvote:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleShare(postId) {
        // prevent article click
        try {
            const shareUrl = `${location.origin}/posts/${postId}`;
            await navigator.clipboard.writeText(shareUrl);
            // optimistically update UI
            setLocalPost(prev => ({ ...prev, shares: (prev.shares ?? 0) + 1 }));
            setShareStatus("Copied!");
            setTimeout(() => setShareStatus(""), 1500);

            // notify backend (swallow errors)
            try {
                await fetch(`/api/posts/${postId}`, 
                { method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "share" })
                },
                );
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
        if (!confirmed) return;

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
        if (!trimmedComment || commentLoading) return;

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

    useEffect(() => {
        const pusher = getPusherClient();
        if (!pusher) return;

        const channel = pusher.subscribe("posts");
        const handler = async (data) => {
            if (!data?.postId) return;
            if (String(data.postId) !== String(post.id)) return;

            try {
                const res = await fetch(`/api/posts/${post.id}`);
                if (!res.ok) return;
                const updated = await res.json();
                setLocalPost(updated);
            } catch (err) {
                console.error("Failed to fetch updated post:", err);
            }
        };

        channel.bind("post.interaction_updated", handler);
        return () => {
            try {
                channel.unbind("post.interaction_updated", handler);
            } catch (e) {}
        };
    }, [post.id]);

    return (
        <article
            className="group rounded-[1.5rem] border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950"
            onClick={() => handlePostClick(post.id)}
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

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1 rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900">
                        <button
                            onClick={(e) => { e.stopPropagation(); if (!loading) handleUpvote(localPost.id); }}
                            className={`text-xl ${localPost.userVote === 1 ? 'text-emerald-600' : 'text-zinc-400'}`}
                            aria-label="Upvote"
                        >
                            ▲
                        </button>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                            {localPost.totalVotes ?? 0}
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); if (!loading) handleDownvote(localPost.id); }}
                            className={`text-xl ${localPost.userVote === -1 ? 'text-rose-600' : 'text-zinc-400'}`}
                            aria-label="Downvote"
                        >
                            ▼
                        </button>
                    </div>

                    <div className="hidden rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 md:block">
                        Preview
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleShare(localPost.id); }}
                            className="text-sm rounded-md border border-zinc-200 bg-white px-3 py-1 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                        >
                            {shareStatus || 'Share'}
                        </button>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">{localPost.shares ?? 0}</div>
                    </div>

                    {localPost.canDelete ? (
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); if (!deleting) handleDelete(localPost.id); }}
                                className="rounded-md border border-rose-200 bg-white px-3 py-1 text-sm text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:bg-zinc-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                                aria-label="Delete post"
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                            {deleteError ? (
                                <div className="max-w-[8rem] text-center text-[11px] text-rose-600 dark:text-rose-400">
                                    {deleteError}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="mt-5 rounded-[1.15rem] border border-zinc-200 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900/90">
                <label htmlFor={`comment-${localPost.id}`} className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    Comment
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                        id={`comment-${localPost.id}`}
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        placeholder="Write a comment..."
                        className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-orange-800 dark:focus:ring-orange-950/40"
                    />
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleComment(localPost.id); }}
                        disabled={commentLoading || !commentText.trim()}
                        className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950"
                    >
                        {commentLoading ? "Posting..." : "Comment"}
                    </button>
                </div>
                {commentError ? (
                    <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                        {commentError}
                    </p>
                ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <span>{new Date(post.createdAt).toLocaleString()}</span>
                <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                <span>{localPost.comments ?? 0} comments</span>
            </div>
        </article>
    );
}