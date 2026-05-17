"use client";

import { POST_CATEGORIES } from "@/lib/posts/categories";

export default function CategoryPicker({
  selected = [],
  onChange,
  mode = "compose",
  className = "",
}) {
  const selectedSet = new Set(selected);
  const isFilterMode = mode === "filter";

  function toggleCategory(categoryId) {
    const next = selectedSet.has(categoryId)
      ? selected.filter((id) => id !== categoryId)
      : [...selected, categoryId];

    onChange(next);
  }

  function clearFilters() {
    onChange([]);
  }

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {isFilterMode ? "Category filters" : "Category tags"}
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {isFilterMode
              ? "Choose the event types that should stay visible in the feed now and on the future map later."
              : "Tag the post so users can understand the event type before they open the card or map popup."}
          </p>
        </div>

        {isFilterMode && selected.length > 0 ? (
          <button
            type="button"
            onClick={clearFilters}
            className="shrink-0 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm transition hover:border-orange-200 hover:text-orange-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-orange-900 dark:hover:text-orange-200"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {POST_CATEGORIES.map((category) => {
          const active = selectedSet.has(category.categoryId);

          return (
            <button
              key={category.categoryId}
              type="button"
              aria-pressed={active}
              title={category.description}
              onClick={() => toggleCategory(category.categoryId)}
              className={[
                "rounded-full border px-3 py-2 text-xs font-semibold shadow-sm transition",
                "focus:outline-none focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/40",
                active
                  ? "border-orange-300 bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-[0_10px_22px_rgba(249,115,22,0.2)] dark:border-orange-700"
                  : "border-zinc-200 bg-white/90 text-zinc-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300 dark:hover:border-orange-900 dark:hover:bg-orange-950/40 dark:hover:text-orange-200",
              ].join(" ")}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      {selected.length > 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {selected.length} {selected.length === 1 ? "category" : "categories"} selected.
        </p>
      ) : null}
    </div>
  );
}