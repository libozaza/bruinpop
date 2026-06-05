"use client";
import { useEffect, useState } from "react";
import { formatPublishedAt } from "@/lib/posts/formatClient";

export default function CommentList({ comments }) {
    // [GenAI Use]: Prompt: Pull the comment rendering out of /posts/[id]/page.js into a separate CommentList.jsx component. The behavior observed on individual post pages should remain the same, but the code should be more modular.
    // Result is shown below
    // Reflection: Here, GenAI was mainly used to refactor the comment rendering into a separate component. The CSS was also done with GenAI in an earlier prompt. the main thing I had to do was fix the state management and handlers to work in the new component.
    const [localComments, setLocalComments] = useState(comments);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [draftContent, setDraftContent] = useState("");
    const [savingCommentId, setSavingCommentId] = useState(null);
    const [deletingCommentId, setDeletingCommentId] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        setLocalComments(comments);

        if (
            editingCommentId &&
            !comments.some((comment) => comment.id === editingCommentId)
        ) {
            setEditingCommentId(null);
            setDraftContent("");
        }
    }, [comments, editingCommentId]);

    // Prompt: Implement the ability to edit and delete comments in frontend using the /api/comments/[commentID]/route.js endpoints. Users should be able to click an "Edit" button next to their comment, which will turn the comment text into an editable textarea. After making changes, they can click "Save" to update the comment or "Cancel" to discard changes. Additionally, there should be a "Delete" button that prompts for confirmation before removing the comment. Ensure that the UI updates optimistically while waiting for the server response and handles any errors gracefully.
    // Result is the functions below and some state above, as well as the buttons and textarea in the JSX
    // Reflection: This prompt with a bit of later iteration created a functional edit and delete button for the frontend. I adjusted some naming and ordering and refactored the component down a little to improve readability.
    function startEditing(comment) {
        setEditingCommentId(comment.id);
        setDraftContent(comment.content);
        setError("");
    }

    function cancelEditing() {
        setEditingCommentId(null);
        setDraftContent("");
        setError("");
    }

    async function saveComment(commentId) {
        const trimmedContent = draftContent.trim();

        if (!trimmedContent) {
            setError("Comment cannot be empty");
            return;
        }

        if (trimmedContent.length > 200) {
            setError("Comment cannot exceed 200 characters");
            return;
        }

        setSavingCommentId(commentId);
        setError("");

        const previousComments = localComments;
        const nextContent = trimmedContent;

        setLocalComments((currentComments) =>
            currentComments.map((comment) =>
                comment.id === commentId
                    ? {
                          ...comment,
                          content: nextContent,
                      }
                    : comment,
            ),
        );
        cancelEditing();

        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: trimmedContent }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error(payload?.error || "Failed to edit comment");
            }

            const updatedComment = await response.json();

            setLocalComments((currentComments) =>
                currentComments.map((comment) =>
                    comment.id === commentId
                        ? {
                              ...comment,
                              content: updatedComment.content,
                              updatedAt: updatedComment.updatedAt ?? comment.updatedAt,
                          }
                        : comment,
                ),
            );
        } catch (saveError) {
            setLocalComments(previousComments);
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : "Failed to edit comment",
            );
        } finally {
            setSavingCommentId(null);
        }
    }

    async function deleteComment(commentId) {
        if (deletingCommentId) {
            return;
        }

        const confirmed = window.confirm("Delete this comment? This cannot be undone.");

        if (!confirmed) {
            return;
        }

        setDeletingCommentId(commentId);
        setError("");

        const previousComments = localComments;

        setLocalComments((currentComments) =>
            currentComments.filter((comment) => comment.id !== commentId),
        );

        if (editingCommentId === commentId) {
            cancelEditing();
        }

        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error(payload?.error || "Failed to delete comment");
            }
        } catch (deleteError) {
            setLocalComments(previousComments);
            setError(
                deleteError instanceof Error
                    ? deleteError.message
                    : "Failed to delete comment",
            );
        } finally {
            setDeletingCommentId(null);
        }
    }

    return (
        <div className="mt-5 space-y-3">
            {localComments.length ? (
                localComments.map((comment) => {
                    const isEditing = editingCommentId === comment.id;
                    const isSaving = savingCommentId === comment.id;
                    const isDeleting = deletingCommentId === comment.id;

                    return (
                        <div
                            key={comment.id}
                            className="rounded-[1.1rem] border border-zinc-200 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900/90"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                        @{comment.username}
                                    </p>

                                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                        {formatPublishedAt(comment.createdAt)}
                                    </p>
                                </div>

                                {comment.canEdit ? (
                                    isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => saveComment(comment.id)}
                                                disabled={isSaving || isDeleting}
                                                className="rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950"
                                            >
                                                {isSaving ? "Saving..." : "Save"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={cancelEditing}
                                                disabled={isSaving || isDeleting}
                                                className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-zinc-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => startEditing(comment)}
                                                disabled={isDeleting}
                                                className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-orange-200 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-orange-900 dark:hover:text-orange-200"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => deleteComment(comment.id)}
                                                disabled={isDeleting}
                                                className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                                            >
                                                {isDeleting ? "Deleting..." : "Delete"}
                                            </button>
                                        </div>
                                    )
                                ) : null}
                            </div>

                            {isEditing ? (
                                <div className="mt-3 space-y-3">
                                    <textarea
                                        value={draftContent}
                                        onChange={(event) => setDraftContent(event.target.value)}
                                        rows={4}
                                        maxLength={200}
                                        className="w-full rounded-[1.1rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-orange-800 dark:focus:ring-orange-950/40"
                                    />

                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                            {draftContent.length}/200 characters
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                    {comment.content}
                                </p>
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="rounded-[1.1rem] border border-dashed border-zinc-300 bg-white/70 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-400">
                    No comments yet. Be the first to reply.
                </div>
            )}

            {error ? (
                <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
            ) : null}
        </div>
    );
}
