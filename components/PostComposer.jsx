"use client";

import { useState } from "react";
import { POST_CATEGORIES } from "@/lib/posts/categories";

export default function PostComposer() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const titleCount = title.length;
  const contentCount = content.length;

  function toggleCategory(categoryId) {
    setCategories((currentCategories) =>
      currentCategories.includes(categoryId)
        ? currentCategories.filter((id) => id !== categoryId)
        : [...currentCategories, categoryId],
    );
  }

  async function readErrorMessage(response) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json().catch(() => null);
      return data?.error || `Request failed with status ${response.status}`;
    }

    const text = await response.text().catch(() => "");
    const trimmed = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return trimmed || `Request failed with status ${response.status}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    if (title.length < 5) {
      setError("Title must be at least 5 characters");
      return;
    }

    if (title.length > 100) {
      setError("Title cannot exceed 100 characters");
      return;
    }

    if (content.length > 1000) {
      setError("Content cannot exceed 1000 characters");
      return;
    }

    if (categories.length === 0) {
      setError("Select at least one category");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, categories }), // do NOT send creatorId; server should attach it
      });

      if (!res.ok) {
        throw new Error(await readErrorMessage(res));
      }

      await res.json();

      // update UI / clear form / optimistic update handled here
      setTitle("");
      setContent("");
      setCategories([]);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Title
        </label>

        <div className="rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm transition focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-orange-700 dark:focus-within:ring-orange-950/40">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
            placeholder="What are you posting about?"
            className="w-full rounded-[1rem] border-0 bg-transparent px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Keep it short and clear.</span>
          <span>{titleCount}/100</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Content
        </label>

        <div className="rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm transition focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-orange-700 dark:focus-within:ring-orange-950/40">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            required
            rows={6}
            placeholder="Add the details, location, time, RSVP info, or anything people should know."
            className="w-full resize-none rounded-[1rem] border-0 bg-transparent px-4 py-3 text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Give people enough context to act.</span>
          <span>{contentCount}/1000</span>
        </div>
      </div>

      <div className="rounded-[1.25rem] border border-orange-100 bg-orange-50/55 p-4 dark:border-orange-950/70 dark:bg-orange-950/20">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700 dark:text-orange-200">
          Category
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

      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="space-y-1">
          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Your post will show up in the feed once it is saved.
          </p>

          {error ? (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {error}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {loading ? "Posting…" : "Publish post"}
        </button>
      </div>
    </form>
  );
}