"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
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
 * @param {{ events?: Array<{
 *   id: string,
 *   title: string,
 *   content?: string,
 *   creatorUsername: string,
 *   hostHype?: object,
 *   category?: string,
 *   locationLabel?: string | null,
 *   latitude: number,
 *   longitude: number,
 * }> }} props
 */
export default function MapView({ events = [] }) {
  return (
    <MapContainer center={UCLA_CENTER} zoom={16} className="h-full w-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
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
