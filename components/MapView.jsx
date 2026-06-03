"use client";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import MapEventPopup from "@/components/MapEventPopup";
import { UCLA_MAP_CENTER, UCLA_MAP_ZOOM } from "@/lib/maps/constants.js";
import { getCategoryMarkerIcon, getComposerDraftPinIcon } from "@/lib/maps/pin-icons.js";

/**
 * @typedef {import("@/lib/maps/geo.js").MapEvent} MapEvent
 */

/**
 * Pan/zoom the map to fit all event markers once they load.
 * @param {{ events: MapEvent[] }} props
 */
function MapFitBounds({ events }) {
  const map = useMap();

  useEffect(() => {
    if (events.length === 0) return;

    if (events.length === 1) {
      map.setView([events[0].latitude, events[0].longitude], UCLA_MAP_ZOOM);
      return;
    }

    const bounds = L.latLngBounds(
      events.map((event) => [event.latitude, event.longitude]),
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
  }, [map, events]);

  return null;
}

/**
 * Keeps the draft pin centered when it is the only point on the map.
 * @param {{ draftPin?: { lat: number, lng: number } | null }} props
 */
function PanToDraftPin({ draftPin }) {
  const map = useMap();

  useEffect(() => {
    if (!draftPin) return;
    map.setView([draftPin.lat, draftPin.lng], Math.max(map.getZoom(), UCLA_MAP_ZOOM), {
      animate: true,
    });
  }, [map, draftPin?.lat, draftPin?.lng]);

  return null;
}

/**
 * @param {{ events?: MapEvent[], draftPin?: { lat: number, lng: number } | null }} props
 */
export default function MapView({ events = [], draftPin = null }) {
  return (
    <MapContainer
      center={UCLA_MAP_CENTER}
      zoom={UCLA_MAP_ZOOM}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapFitBounds events={events} />
      <PanToDraftPin draftPin={draftPin} />
      {events.map((event) => (
        <Marker
          key={event.id}
          position={[event.latitude, event.longitude]}
          icon={getCategoryMarkerIcon(event.pinCategoryId)}
        >
          <Popup>
            <MapEventPopup event={event} />
          </Popup>
        </Marker>
      ))}
      {draftPin ? (
        <Marker
          position={[draftPin.lat, draftPin.lng]}
          icon={getComposerDraftPinIcon()}
          zIndexOffset={1000}
        >
          <Popup>
            <p className="text-sm font-medium text-zinc-900">Draft event location</p>
            <p className="text-xs text-zinc-500">This pin updates as you compose.</p>
          </Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}
