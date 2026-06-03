"use client";

import { useEffect, useRef, useState } from "react";
import { MIN_GEOCODE_QUERY_LENGTH } from "@/lib/maps/geocode.js";

/**
 * @typedef {"idle" | "loading" | "found" | "not_found" | "error"} GeocodeStatus
 */

/**
 * Debounced address → coordinates lookup via /api/geocode.
 *
 * @param {string} address
 * @param {{
 *   enabled?: boolean,
 *   onResult?: (result: { lat: number, lng: number, label: string }) => void,
 * }} options
 * @returns {GeocodeStatus}
 */
export function useAddressGeocode(address, { enabled = true, onResult } = {}) {
  const [status, setStatus] = useState(/** @type {GeocodeStatus} */ ("idle"));
  const requestIdRef = useRef(0);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const trimmed = address.trim();

    if (!enabled || trimmed.length < MIN_GEOCODE_QUERY_LENGTH) {
      setStatus("idle");
      return;
    }

    const timeout = window.setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      setStatus("loading");

      try {
        const response = await fetch(
          `/api/geocode?q=${encodeURIComponent(trimmed)}`,
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
        onResultRef.current?.(data);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setStatus("error");
      }
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [address, enabled]);

  return status;
}
