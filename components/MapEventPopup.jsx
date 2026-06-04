"use client";

import Link from "next/link";

import HostCredibility from "@/components/HostCredibility";
import ReportPostButton from "@/components/ReportPost";

import {
  appleMapsDirectionsUrl,
  googleMapsDirectionsUrl,
} from "@/lib/maps/directions.js";

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

  const directionsLabel = locationLine || event.title;

  const googleMapsUrl = googleMapsDirectionsUrl(
    event.latitude,
    event.longitude,
    directionsLabel,
  );

  const appleMapsUrl = appleMapsDirectionsUrl(
    event.latitude,
    event.longitude,
    directionsLabel,
  );

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
          <p className="text-xs leading-relaxed text-zinc-600">
            {contentPreview}
          </p>
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

      <div className="space-y-2 border-t border-zinc-200 pt-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Get directions
        </p>

        <div className="flex flex-col gap-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-700"
          >
            Open in Google Maps
          </a>

          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Open in Apple Maps
          </a>
        </div>
      </div>

      <div className="space-y-2 border-t border-zinc-200 pt-3">
        <Link
          href={`/posts/${event.id}`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100"
        >
          View full post
        </Link>

        <div onClick={(clickEvent) => clickEvent.stopPropagation()}>
          <ReportPostButton
            postId={event.id}
            buttonLabel="Report this event"
            buttonClassName="inline-flex w-full items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
          />
        </div>
      </div>
    </div>
  );
}