"use client";

import { useEffect, useRef, useState } from "react";

/**
 * @typedef {"idle" | "loading" | "found" | "not_found" | "error"} ReverseGeocodeStatus
 */

/**
 * when a map pin moves, look up the nearest address via /api/geocode?lat=&lng=
 *
 * @param {{ lat: number, lng: number } | null} pin
 * @param {{
 *   enabled?: boolean,
 *   onAddress?: (label: string) => void,
 * }} options
 * @returns {ReverseGeocodeStatus}
 */
export function usePinReverseGeocode(pin, { enabled = true, onAddress } = {}) {
  const [status, setStatus] = useState(
    /** @type {ReverseGeocodeStatus} */ ("idle"),
  );
  const requestIdRef = useRef(0);
  const onAddressRef = useRef(onAddress);

  useEffect(() => {
    onAddressRef.current = onAddress;
  }, [onAddress]);

  useEffect(() => {
    if (!enabled || !pin) {
      setStatus("idle");
      return;
    }

    const timeout = window.setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      setStatus("loading");

      try {
        const response = await fetch(
          `/api/geocode?lat=${encodeURIComponent(pin.lat)}&lng=${encodeURIComponent(pin.lng)}`,
        );

        if (requestId !== requestIdRef.current) return;

        if (response.status === 404) {
          setStatus("not_found");
          return;
        }

        if (!response.ok) {
          setStatus("error");
          return;
        }

        const data = await response.json();
        if (requestId !== requestIdRef.current) return;

        setStatus("found");
        if (data.label) {
          onAddressRef.current?.(data.label);
        }
      } catch {
        if (requestId !== requestIdRef.current) return;
        setStatus("error");
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [pin?.lat, pin?.lng, enabled]);

  return status;
}
