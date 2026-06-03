"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { POST_CATEGORIES } from "@/lib/posts/categories";
import { CAMPUS_LOCATIONS } from "@/lib/maps/campus-locations.js";
import { useAddressGeocode } from "@/components/useAddressGeocode";
import { usePinReverseGeocode } from "@/components/usePinReverseGeocode";

const ComposerPinPicker = dynamic(
  () => import("@/components/ComposerPinPicker"),
  {
    ssr: false,
    loading: () => (
      <div
        className="animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
        style={{ height: 220 }}
      />
    ),
  },
);

/**
 * @param {{ onDraftPinChange?: (pin: { lat: number, lng: number } | null) => void }} props
 */
export default function PostComposer({ onDraftPinChange }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [campusLocationId, setCampusLocationId] = useState("");
  /** @type {[null | { lat: number, lng: number }, Function]} */
  const [mapPin, setMapPin] = useState(null);
  const [pinSource, setPinSource] = useState("none");
  const skipForwardGeocodeRef = useRef(false);

  const titleCount = title.length;
  const contentCount = content.length;

  useEffect(() => {
    onDraftPinChange?.(mapPin);
  }, [mapPin, onDraftPinChange]);

  const geocodeEnabled = useMemo(() => {
    if (pinSource !== "preset" || !campusLocationId) return true;
    const preset = CAMPUS_LOCATIONS.find((loc) => loc.id === campusLocationId);
    if (!preset) return true;
    return address.trim() !== preset.label;
  }, [address, campusLocationId, pinSource]);

  const handleGeocodeResult = useCallback((result) => {
    setMapPin({ lat: result.lat, lng: result.lng });
    setCampusLocationId("");
    setPinSource("geocoded");
  }, []);

  const applyAddressFromPin = useCallback((label) => {
    skipForwardGeocodeRef.current = true;
    setAddress(label);
  }, []);

  const geocodeStatus = useAddressGeocode(address, {
    enabled: geocodeEnabled,
    onResult: handleGeocodeResult,
    skipNextLookupRef: skipForwardGeocodeRef,
  });

  const reverseGeocodeStatus = usePinReverseGeocode(mapPin, {
    enabled: pinSource === "custom" && Boolean(mapPin),
    onAddress: applyAddressFromPin,
  });

  function handleAddressChange(nextAddress) {
    setAddress(nextAddress);

    if (pinSource === "preset" && campusLocationId) {
      const preset = CAMPUS_LOCATIONS.find((loc) => loc.id === campusLocationId);
      if (preset && nextAddress.trim() !== preset.label) {
        setCampusLocationId("");
        setPinSource("none");
      }
    }
  }

  function handlePinChange(nextPin) {
    setMapPin(nextPin);
    if (!nextPin) {
      setCampusLocationId("");
      setPinSource("none");
      return;
    }
    setCampusLocationId("");
    setPinSource("custom");
  }

  function pinStatusLabel() {
    if (!mapPin) return "No map pin yet";
    if (pinSource === "preset") return "Campus preset";
    if (pinSource === "geocoded") return "From address lookup";
    return "Placed on map";
  }

  function toggleCategory(categoryId) {
    setCategories((currentCategories) =>
      currentCategories.includes(categoryId)
        ? currentCategories.filter((id) => id !== categoryId)
        : [...currentCategories, categoryId],
    );
  }

  function generateQuarterHourTimes() {
    const arr = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        arr.push(`${hh}:${mm}`);
      }
    }
    return arr;
  }

  async function readErrorMessage(response) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json().catch(() => null);
      return data?.error || `Request failed with status ${response.status}`;
    }

    const text = await response.text().catch(() => "");
    const trimmed = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return trimmed || `Request failed with status ${response.status}`;
  }

  async function resolveSubmitAddress() {
    const trimmed = address.trim();
    if (trimmed) return trimmed;

    if (pinSource === "preset" && campusLocationId) {
      const preset = CAMPUS_LOCATIONS.find((loc) => loc.id === campusLocationId);
      if (preset?.label) return preset.label;
    }

    if (mapPin) {
      try {
        const response = await fetch(
          `/api/geocode?lat=${encodeURIComponent(mapPin.lat)}&lng=${encodeURIComponent(mapPin.lng)}`,
        );
        if (response.ok) {
          const data = await response.json();
          if (data.label) return data.label;
        }
      } catch {
        // fall through to coordinate fallback
      }
      return `${mapPin.lat.toFixed(5)}, ${mapPin.lng.toFixed(5)}`;
    }

    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) return;

    setError("");

    if (title.length < 5) {
      setError("Title must be at least 5 characters");
      return;
    }

    if (title.length > 100) {
      setError("Title cannot exceed 100 characters");
      return;
    }

    if (content.length > 1000) {
      setError("Content cannot exceed 1000 characters");
      return;
    }

    if (categories.length === 0) {
      setError("Select at least one category");
      return;
    }

    if (!date) {
      setError("Please provide a date for the post");
      return;
    }

    if (!time) {
      setError("Please provide a time for the post");
      return;
    }

    const hasLocation =
      Boolean(mapPin) ||
      (pinSource === "preset" && Boolean(campusLocationId));

    if (!address.trim() && !hasLocation) {
      setError("Drop a pin on the map or enter an address");
      return;
    }

    setLoading(true);

    try {
      const submitAddress = await resolveSubmitAddress();
      if (!submitAddress) {
        setError("Drop a pin on the map or enter an address");
        setLoading(false);
        return;
      }

      const combined = `${date}T${time}`;
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          categories,
          date: combined,
          address: submitAddress,
          ...(pinSource === "preset" && campusLocationId
            ? { campusLocationId }
            : {}),
          ...(mapPin && pinSource !== "preset"
            ? {
                location: {
                  lat: mapPin.lat,
                  lng: mapPin.lng,
                  label: submitAddress,
                },
              }
            : {}),
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorMessage(res));
      }

      await res.json();

      setTitle("");
      setContent("");
      setCategories([]);
      setDate("");
      setTime("");
      setAddress("");
      setCampusLocationId("");
      setMapPin(null);
      setPinSource("none");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="space-y-4 rounded-[1.25rem] border-2 border-orange-200 bg-orange-50/40 p-4 dark:border-orange-900/70 dark:bg-orange-950/20">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700 dark:text-orange-200">
            Event location
          </p>
          <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-400">
            Drop a pin on the map, pick a campus spot, or type an address. If you
            only use the pin, we fill in the nearest address automatically.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Address{" "}
            <span className="font-normal text-zinc-400">(optional with pin)</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="Auto-filled when you drop a pin, or type one yourself"
            maxLength={200}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-orange-700 dark:focus:ring-orange-950/40"
          />
          {reverseGeocodeStatus === "loading" ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Finding nearest address for your pin…
            </p>
          ) : null}
          {reverseGeocodeStatus === "found" && pinSource === "custom" ? (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Address updated from your pin location.
            </p>
          ) : null}
          {reverseGeocodeStatus === "not_found" && pinSource === "custom" ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              No street address found here — coordinates will still be saved.
            </p>
          ) : null}
          {geocodeStatus === "loading" ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Looking up address on the map…
            </p>
          ) : null}
          {geocodeStatus === "found" && pinSource === "geocoded" ? (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Pin placed from your address. Drag either map to fine-tune.
            </p>
          ) : null}
          {geocodeStatus === "not_found" ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Could not find that address — try a campus preset or click the map.
            </p>
          ) : null}
          {geocodeStatus === "error" ? (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              Address lookup failed. You can still place a pin manually.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Campus preset (optional)
          </label>
          <select
            value={campusLocationId}
            onChange={(e) => {
              const nextId = e.target.value;
              setCampusLocationId(nextId);
              const preset = CAMPUS_LOCATIONS.find((loc) => loc.id === nextId);
              if (!preset) {
                setCampusLocationId("");
                if (pinSource === "preset") {
                  setMapPin(null);
                  setPinSource("none");
                }
                return;
              }
              setMapPin({
                lat: preset.latitude,
                lng: preset.longitude,
              });
              setPinSource("preset");
              if (!address.trim()) {
                setAddress(preset.label);
              }
            }}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="">Choose a campus landmark…</option>
            {CAMPUS_LOCATIONS.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>

        <ComposerPinPicker pin={mapPin} onPinChange={handlePinChange} />

        <div className="rounded-xl border border-orange-100 bg-white/80 px-3 py-2 text-xs dark:border-orange-950 dark:bg-zinc-900/80">
          <span className="font-medium text-zinc-700 dark:text-zinc-200">
            Pin status:{" "}
          </span>
          <span className="text-zinc-600 dark:text-zinc-400">
            {pinStatusLabel()}
          </span>
          {mapPin ? (
            <span className="ml-2 tabular-nums text-zinc-500">
              ({mapPin.lat.toFixed(4)}, {mapPin.lng.toFixed(4)})
            </span>
          ) : null}
        </div>
      </section>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Title
        </label>
        <div className="rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm transition focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-orange-700 dark:focus-within:ring-orange-950/40">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
            placeholder="What are you posting about?"
            className="w-full rounded-[1rem] border-0 bg-transparent px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Keep it short and clear.</span>
          <span>{titleCount}/100</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Content
        </label>
        <div className="rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm transition focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-orange-700 dark:focus-within:ring-orange-950/40">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            required
            rows={5}
            placeholder="Add the details, RSVP info, or anything people should know."
            className="w-full resize-none rounded-[1rem] border-0 bg-transparent px-4 py-3 text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Give people enough context to act.</span>
          <span>{contentCount}/1000</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Time
          </label>
          <input
            type="time"
            list="quarter-times"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <datalist id="quarter-times">
            {generateQuarterHourTimes().map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="rounded-[1.25rem] border border-orange-100 bg-orange-50/55 p-4 dark:border-orange-950/70 dark:bg-orange-950/20">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700 dark:text-orange-200">
          Category
        </p>
        <div className="flex flex-wrap gap-2">
          {POST_CATEGORIES.map((category) => {
            const selected = categories.includes(category.categoryId);
            return (
              <button
                key={category.categoryId}
                type="button"
                onClick={() => toggleCategory(category.categoryId)}
                title={category.description}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  selected
                    ? "border-orange-300 bg-orange-100 text-orange-700 shadow-sm dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-orange-200 hover:text-orange-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-orange-900 dark:hover:text-orange-200",
                ].join(" ")}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="space-y-1">
          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Published events appear in the feed and on the map.
          </p>
          {error ? (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {error}
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {loading ? "Posting…" : "Publish post"}
        </button>
      </div>
    </form>
  );
}
