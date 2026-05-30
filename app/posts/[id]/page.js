"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const params = useParams();
	const postId = params?.id;

	useEffect(() => {
		if (!postId) return;

		let active = true;

		async function fetchPost() {
			try {
				setLoading(true);
				setError("");

				const response = await fetch(`/api/posts/${postId}`);
				if (!response.ok) {
					throw new Error(response.status === 404 ? "Post not found" : "Failed to load post");
				}

				const data = await response.json();
				if (!active) return;
				setPost(data);
				setComments(data.commentList ?? []);
			} catch (fetchError) {
				if (!active) return;
				setError(fetchError instanceof Error ? fetchError.message : "Failed to load post");
			} finally {
				if (active) setLoading(false);
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
		if (!postId || !trimmedContent || commentLoading) return;

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
			setCommentError(commentSubmitError instanceof Error ? commentSubmitError.message : "Failed to add comment");
		} finally {
			setCommentLoading(false);
		}
	}

	const publishedAt = post ? formatPublishedAt(post.createdAt) : "";
	const creatorInitial = post?.creatorUsername?.charAt(0)?.toUpperCase() || "P";

	return (
		<div className="relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_28%),radial-gradient(circle_at_right,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#fff7ed_0%,_#f8fafc_38%,_#ffffff_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.16),_transparent_24%),radial-gradient(circle_at_right,_rgba(59,130,246,0.12),_transparent_20%),linear-gradient(180deg,_#09090b_0%,_#111827_45%,_#09090b_100%)] sm:py-10">
			<div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(255,255,255,0.58),transparent)] dark:bg-[linear-gradient(180deg,rgba(9,9,11,0.72),transparent)]" />

			<div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 lg:gap-8">
				<header className="flex flex-col gap-4 rounded-[2rem] border border-white/60 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/75 dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] sm:p-7">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<Link
							href="/posts"
							className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:text-orange-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-orange-900/60 dark:hover:text-orange-200"
						>
							<span aria-hidden="true">←</span>
							Back to posts
						</Link>

						<div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 shadow-sm dark:border-orange-900/60 dark:bg-orange-950/70 dark:text-orange-200">
							<span className="h-2 w-2 rounded-full bg-orange-500" />
							BruinPop · single post
						</div>
					</div>

					<div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
						<div className="space-y-3">
							<p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
								Post detail
							</p>
							<h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
								{loading ? "Loading post…" : post?.title ?? "Post not found"}
							</h1>
							<p className="max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-400 sm:text-base">
								{error || "A focused view for one campus post, with the host profile and trust tier surfaced alongside the content."}
							</p>
						</div>

						<div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
							<div className="rounded-2xl border border-zinc-200 bg-white/85 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/85">
								<p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
									Author
								</p>
								<p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
									{post ? `@${post.creatorUsername}` : "—"}
								</p>
							</div>
							<div className="rounded-2xl border border-zinc-200 bg-white/85 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/85">
								<p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
									Tier
								</p>
								<p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
									{post ? post.hostHype.label : "—"}
								</p>
							</div>
							<div className="rounded-2xl border border-zinc-200 bg-white/85 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/85">
								<p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
									Published
								</p>
								<p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
									{post ? publishedAt : "—"}
								</p>
							</div>
						</div>
					</div>
				</header>

				<div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_0.85fr] lg:items-start">
					<article className="rounded-[1.9rem] border border-white/60 bg-white/80 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80 dark:shadow-[0_18px_48px_rgba(0,0,0,0.35)] sm:p-8">
						{loading ? (
							<div className="space-y-4">
								<div className="h-6 w-40 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
								<div className="h-4 w-72 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
								<div className="h-4 w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
								<div className="h-4 w-5/6 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
							</div>
						) : post ? (
						<div className="space-y-0">
							<div className="flex flex-wrap items-start justify-between gap-4">
							<div className="flex items-start gap-4">
								<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-500 text-xl font-semibold text-white shadow-[0_10px_30px_rgba(249,115,22,0.35)]">
									{creatorInitial}
								</div>

								<div className="space-y-2">
									<div className="flex flex-wrap items-center gap-2">
										<p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
											@{post.creatorUsername}
										</p>
										<span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
											{post.hostHype.shortLabel}
										</span>
									</div>
									<p className="text-sm text-zinc-500 dark:text-zinc-400">
											{post.hostHype.hypeScore} hype · feed boost {post.hostHype.feedBoost}
									</p>
								</div>
							</div>

							<div className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
								{publishedAt}
							</div>
						</div>

							<div className="mt-7 border-t border-zinc-200 pt-6 dark:border-zinc-800">
							<p className="whitespace-pre-wrap text-base leading-8 text-zinc-700 dark:text-zinc-300 sm:text-lg">
									{post.content}
							</p>
						</div>

							<div className="mt-8 flex flex-wrap gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
							<button
								type="button"
								className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 dark:bg-zinc-100 dark:text-zinc-950"
							>
								Reply soon
							</button>
							<button
								type="button"
								className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:text-orange-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-orange-900/60 dark:hover:text-orange-200"
							>
								Save post
							</button>
							</div>
						</div>
						) : (
							<div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-white/70 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-400">
								{error || "Post not found."}
							</div>
						)}
					</article>

					<aside className="grid gap-6">
						<section className="rounded-[1.7rem] border border-white/60 bg-white/80 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80 dark:shadow-[0_18px_48px_rgba(0,0,0,0.35)] sm:p-6">
							<p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
								Host credibility
							</p>
							<div className="mt-4 rounded-[1.25rem] border border-zinc-200 bg-gradient-to-br from-white to-orange-50 p-4 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
								<div className="flex items-center gap-3">
									<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-lg font-semibold text-white">
										{creatorInitial}
									</div>
									<div>
										<p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
											{post ? `@${post.creatorUsername}` : "—"}
										</p>
										<p className="text-sm text-zinc-500 dark:text-zinc-400">
											{post ? post.hostHype.label : "—"}
										</p>
									</div>
								</div>

								<div className="mt-5 grid grid-cols-2 gap-3">
									<div className="rounded-2xl bg-white/85 p-3 dark:bg-zinc-900/85">
										<p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
											Score
										</p>
										<p className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
												{post ? post.hostHype.hypeScore : "—"}
										</p>
									</div>
									<div className="rounded-2xl bg-white/85 p-3 dark:bg-zinc-900/85">
										<p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
											Boost
										</p>
										<p className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
												{post ? `+${post.hostHype.feedBoost}` : "—"}
										</p>
									</div>
								</div>
							</div>
						</section>

						<section className="rounded-[1.7rem] border border-white/60 bg-white/80 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80 dark:shadow-[0_18px_48px_rgba(0,0,0,0.35)] sm:p-6">
							<p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
								Snapshot
							</p>
							<div className="mt-4 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
								<p>
									This detail view keeps the focus on one post while still exposing the
									trust signal behind the host.
								</p>
								<p>
									It is a clean foundation for future actions like comments, RSVPs, and
									sharing.
								</p>
							</div>
						</section>

						<section className="rounded-[1.7rem] border border-white/60 bg-white/80 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80 dark:shadow-[0_18px_48px_rgba(0,0,0,0.35)] sm:p-6">
							<div className="flex items-center justify-between gap-3">
								<p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
									Comments
								</p>
								<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
									{post ? `${post.comments ?? 0} total` : "—"}
								</span>
							</div>

							<form className="mt-4 space-y-3" onSubmit={handleCommentSubmit}>
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

							{commentError ? (
								<p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
									{commentError}
								</p>
							) : null}

							<div className="mt-5 space-y-3">
								{comments.length ? (
									comments.map((comment) => (
										<div key={comment.id} className="rounded-[1.1rem] border border-zinc-200 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900/90">
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
					</aside>
				</div>
			</div>
		</div>
	);
}
