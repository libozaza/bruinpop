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

// NOTE! The ternaries and buttons I modified myself! Took the old buttons and values and changed them.

// Gen AI Prompt: 
// Given that you are an expert frontend developer in react, next.js, jsx, and tailwind css, create the frontend logic and ui for a reusable bruinpop category selector component.
// Build a component that can work in two modes: a filter mode for choosing which post categories stay visible, and a tag mode for labeling a post with its category. The heading should change depending on the mode, showing “Category Filters” when filtering and “Category Tags” when tagging.
// Render the available categories by mapping through POST_CATEGORIES. Each category should appear as a rounded button using its categoryId as the key, its label as the visible text, and its description as the title tooltip. Track whether each category is selected by checking selectedSet, and use that active state to update the button styling.
// When a category button is clicked, call toggleCategory with that category’s categoryId. Use aria-pressed so the selected state is available to assistive technology.
// In filter mode, if at least one category is selected, show a Clear button that calls clearFilters. At the bottom, if any categories are selected, show a small message saying how many categories are currently selected.
// Style the component with tailwind css using a compact stacked layout, responsive wrapping category buttons, active and inactive visual states, hover states, focus rings, dark mode support, and optional className support on the outer container.

// LLM Response Start: Here is a clean implementation of the reusable BruinPop category selector component based on your requirements.

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            {isFilterMode ? "Category Filters" : "Category Tags"}
          </p>
          {/* <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {isFilterMode
              ? "Choose the event types that should stay visible in the feed now and on the future map later."
              : "Tag the post so users can understand the event type before they open the card or map popup."}
          </p> */}
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
// This JSX returns a reusable category selection UI that can behave differently depending on isFilterMode. The outer wrapper combines the default space-y-3 layout with an optional className prop using a template string and .trim(), which lets the parent component add extra styling without breaking the base layout.
// The header section uses a flex layout to place the title on the left and the optional clear button on the right. The title is controlled by isFilterMode, so the same component can display either Category Filters or Category Tags. There is also a commented-out helper text block, which suggests the component originally had explanatory copy for each mode but it was disabled to keep the UI cleaner.
// The Clear button only renders when the component is in filter mode and at least one category is selected. This is handled with isFilterMode && selected.length > 0. Clicking the button calls clearFilters, which should reset the selected category filters somewhere else in the component logic or parent state.
// The category buttons are generated by mapping over POST_CATEGORIES. For each category, the code checks whether that category is active by calling selectedSet.has(category.categoryId). That active state controls both accessibility and styling. The aria-pressed={active} attribute marks the button as a toggle button, while the conditional class string switches between the orange active style and the neutral inactive style.
// Each button calls toggleCategory(category.categoryId) when clicked. This means the component does not hardcode category behavior inside the JSX. Instead, it delegates the selection logic to a helper function, which makes the UI easier to reuse for both filtering posts and tagging posts.
// The selected count at the bottom is conditionally rendered when selected.length > 0. It also handles singular and plural wording by switching between category and categories, so the message reads correctly for one selected category or multiple selected categories.
// The styling is handled mostly through tailwind css utility classes. The component uses wrapping flex rows for the category buttons, rounded pill-shaped buttons, borders, shadows, hover states, focus rings, active gradient styling, and dark mode variants.
// LLM Response End

// Since the frontend was not covered as deeply in class, i used genai to help make this kind of ui cleaner and faster instead of spending too much time on repetitive layout and tailwind styling.
// This let me focus more on the harder backend parts, like api calls, auth logic, database work, and making sure the frontend actually connected correctly. Also laid foundations for buttons and conditionals I modified.