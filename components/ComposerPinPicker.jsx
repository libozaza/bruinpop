"use client";

import { useEffect, useMemo, useRef } from "react";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { UCLA_MAP_CENTER, UCLA_MAP_ZOOM } from "@/lib/maps/constants.js";
import { getComposerDraftPinIcon } from "@/lib/maps/pin-icons.js";

/**
 * @typedef {{ lat: number, lng: number }} MapPinCoords
 */

/**
 * @param {{ onPlace: (lat: number, lng: number) => void }} props
 */
function MapClickToPlace({ onPlace }) {
  useMapEvents({
    click(e) {
      onPlace(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * @param {{ position: [number, number] | null }} props
 */
function PanToPin({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;
    map.setView(position, Math.max(map.getZoom(), UCLA_MAP_ZOOM), {
      animate: true,
    });
  }, [map, position]);

  return null;
}

/**
 * @param {{
 *   position: [number, number],
 *   onDragEnd: (lat: number, lng: number) => void,
 * }} props
 */
function DraggablePin({ position, onDragEnd }) {
  const markerRef = useRef(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (!marker) return;
        const { lat, lng } = marker.getLatLng();
        onDragEnd(lat, lng);
      },
    }),
    [onDragEnd],
  );

  return (
    <Marker
      draggable
      ref={markerRef}
      position={position}
      icon={getComposerDraftPinIcon()}
      eventHandlers={eventHandlers}
    />
  );
}

/**
 * Small UCLA map for choosing event coordinates (click or drag).
 *
 * @param {{
 *   pin: MapPinCoords | null,
 *   onPinChange: (pin: MapPinCoords | null) => void,
 * }} props
 */
export default function ComposerPinPicker({ pin, onPinChange }) {
  const markerPosition = pin ? [pin.lat, pin.lng] : null;

  function setPin(lat, lng) {
    onPinChange({ lat, lng });
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <MapContainer
          center={UCLA_MAP_CENTER}
          zoom={UCLA_MAP_ZOOM}
          className="h-52 w-full"
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapClickToPlace onPlace={setPin} />
          <PanToPin position={markerPosition} />
          {markerPosition ? (
            <DraggablePin
              position={markerPosition}
              onDragEnd={setPin}
            />
          ) : null}
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span>Click the map to place a pin, or drag it to adjust.</span>
        {pin ? (
          <button
            type="button"
            onClick={() => onPinChange(null)}
            className="font-medium text-orange-700 hover:underline dark:text-orange-300"
          >
            Clear pin
          </button>
        ) : null}
      </div>
      {pin ? (
        <p className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
          {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
        </p>
      ) : null}
    </div>
  );
}
