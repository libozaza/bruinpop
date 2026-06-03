"use client";

import Link from "next/link";
import HostCredibility from "@/components/HostCredibility";

/**
 * @typedef {import("@/lib/maps/geo.js").MapEvent} MapEvent
 */

/**
 * @param {string | Date | null | undefined} date
 * @returns {string | null}
 */
function formatEventDate(date) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Small post preview shown when a map marker is clicked.
 *
 * @param {{ event: MapEvent }} props
 */
export default function MapEventPopup({ event }) {
  const when = formatEventDate(event.date);
  const locationLine = event.locationLabel || event.address || null;
  const contentPreview =
    event.content && event.content.length > 140
      ? `${event.content.slice(0, 140).trim()}…`
      : event.content;

  return (
    <div className="min-w-[240px] max-w-[280px] space-y-3 p-1">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold leading-snug text-zinc-900">
          {event.title}
        </h3>

        {event.categoryLabels?.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {event.categoryLabels.map((label) => (
              <span
                key={label}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600"
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}

        {contentPreview ? (
          <p className="text-xs leading-relaxed text-zinc-600">{contentPreview}</p>
        ) : null}
      </div>

      <HostCredibility
        username={event.creatorUsername}
        hypeScore={event.hostHype?.hypeScore ?? 0}
        className="text-xs"
      />

      <dl className="space-y-1.5 text-xs text-zinc-600">
        {when ? (
          <div className="flex gap-2">
            <dt className="shrink-0 font-medium text-zinc-500">When</dt>
            <dd>{when}</dd>
          </div>
        ) : null}
        {locationLine ? (
          <div className="flex gap-2">
            <dt className="shrink-0 font-medium text-zinc-500">Where</dt>
            <dd className="leading-snug">{locationLine}</dd>
          </div>
        ) : null}
      </dl>

      <Link
        href={`/posts/${event.id}`}
        className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100"
      >
        View full post
      </Link>
    </div>
  );
}
