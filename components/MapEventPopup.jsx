"use client";

import HostCredibility from "@/components/HostCredibility";
import {
  appleMapsDirectionsUrl,
  googleMapsDirectionsUrl,
} from "@/lib/maps/directions.js";

/**
 * @param {{ event: {
 *   id: string,
 *   title: string,
 *   content?: string,
 *   creatorUsername: string,
 *   hostHype?: { hypeScore?: number },
 *   category?: string,
 *   locationLabel?: string | null,
 *   latitude: number,
 *   longitude: number,
 * }}} props
 */
export default function MapEventPopup({ event }) {
  const label = event.locationLabel || event.title;
  const googleUrl = googleMapsDirectionsUrl(
    event.latitude,
    event.longitude,
    label,
  );
  const appleUrl = appleMapsDirectionsUrl(
    event.latitude,
    event.longitude,
    label,
  );

  return (
    <div className="min-w-[220px] space-y-3 p-1">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-zinc-900">{event.title}</h3>
        {event.locationLabel ? (
          <p className="text-xs text-zinc-600">{event.locationLabel}</p>
        ) : null}
      </div>

      <HostCredibility
        username={event.creatorUsername}
        hypeScore={event.hostHype?.hypeScore ?? 0}
        className="text-xs"
      />

      <div className="flex flex-col gap-2">
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-700"
        >
          Open in Google Maps
        </a>
        <a
          href={appleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Open in Apple Maps
        </a>
      </div>
    </div>
  );
}
