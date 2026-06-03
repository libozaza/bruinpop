"use client";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import MapEventPopup from "@/components/MapEventPopup";

const UCLA_CENTER = [34.0689, -118.4452];

const defaultIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

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
      map.setView([events[0].latitude, events[0].longitude], 16);
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
 * @param {{ events?: MapEvent[] }} props
 */
export default function MapView({ events = [] }) {
  return (
    <MapContainer center={UCLA_CENTER} zoom={16} className="h-full w-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapFitBounds events={events} />
      {events.map((event) => (
        <Marker key={event.id} position={[event.latitude, event.longitude]}>
          <Popup>
            <MapEventPopup event={event} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
