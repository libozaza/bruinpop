"use client";
import { useState, useEffect } from "react";
import { getPusherClient } from "@/lib/pusher/pusher-client";

export default function Post({ post, index, handlePostClick }) {
    const [localPost, setLocalPost] = useState(post);
    const [loading, setLoading] = useState(false);

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

        channel.bind("post.vote_updated", handler);
        return () => {
            try {
                channel.unbind("post.vote_updated", handler);
                pusher.unsubscribe("posts");
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
                    <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        @{post.creatorUsername}
                    </p>
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
                </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <span>{new Date(post.createdAt).toLocaleString()}</span>
                <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                <span>Looks ready for likes, RSVP, and comments</span>
            </div>
        </article>
    );
}