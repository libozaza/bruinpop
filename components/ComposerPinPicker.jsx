"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const COMPOSER_MAP_HEIGHT = 220;

/**
 * @typedef {{ lat: number, lng: number }} MapPinCoords
 */

function MapInvalidateSize() {
  const map = useMap();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      map.invalidateSize();
    });
    const timeout = window.setTimeout(() => map.invalidateSize(), 250);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [map]);

  return null;
}

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
 * @param {{ lat: number, lng: number } | null} pin
 */
function PanToPin({ pin }) {
  const map = useMap();

  useEffect(() => {
    if (!pin) return;
    map.setView([pin.lat, pin.lng], Math.max(map.getZoom(), UCLA_MAP_ZOOM), {
      animate: true,
    });
    map.invalidateSize();
  }, [map, pin?.lat, pin?.lng]);

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
 * smal UCLA map for choosing event coordinates in the composer sidebar
 *
 * @param {{
 *   pin: MapPinCoords | null,
 *   onPinChange: (pin: MapPinCoords | null) => void,
 * }} props
 */
export default function ComposerPinPicker({ pin, onPinChange }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const markerPosition = useMemo(
    () => (pin ? [pin.lat, pin.lng] : null),
    [pin?.lat, pin?.lng],
  );

  function setPin(lat, lng) {
    onPinChange({ lat, lng });
  }

  if (!mounted) {
    return (
      <div
        className="animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
        style={{ height: COMPOSER_MAP_HEIGHT }}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div
        className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
        style={{ height: COMPOSER_MAP_HEIGHT }}
      >
        <MapContainer
          center={pin ? [pin.lat, pin.lng] : UCLA_MAP_CENTER}
          zoom={UCLA_MAP_ZOOM}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapInvalidateSize />
          <MapClickToPlace onPlace={setPin} />
          <PanToPin pin={pin} />
          {markerPosition ? (
            <DraggablePin position={markerPosition} onDragEnd={setPin} />
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
