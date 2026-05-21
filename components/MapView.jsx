"use client";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";

const UCLA_CENTER = [34.0689, -118.4452];
const UCLA_BOUNDS = [
  [34.057, -118.453],
  [34.075, -118.441],
];

export default function MapView({ events = [] }) {
  return (
    <MapContainer
      center={UCLA_CENTER}
      zoom={16}
      minZoom={14}
      maxBounds={UCLA_BOUNDS}
      maxBoundsViscosity={1.0}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
    </MapContainer>
  );
}
