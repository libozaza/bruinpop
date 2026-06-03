"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { REPORT_REASONS } from "@/lib/posts/moderation.js";

export default function ReportPostButton({ postId, onReported, onOpenChange }) {
  // default behavior for auto state reset
  const emptyReason = "";
  const closeTimerRef = useRef(null);

  // state behavior
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(emptyReason);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // helper that tries to extract error message from response
  async function readErrorMessage(response) {
    const data = await response.json().catch(() => null);
    return data?.error || `Request failed with status ${response.status}`;
  }

  // resets form state to default values (which is nothing)
  function resetForm() {
    setReason(emptyReason);
    setDetails("");
    setMessage("");
    setError("");
    setLoading(false);
  }

  // helper to update open state and call onOpenChange callback
  function updateOpen(nextOpen) {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  // helper to close the report window and reset form state
  function closeReportWindow() {
    // uses timerref to delay closing the report window after successful submission
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    updateOpen(false);
    resetForm();
  }

  function toggleReportWindow() {
    if (open) {
      closeReportWindow();
      return;
    }

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    resetForm();
    updateOpen(true);
  }

  // effect to safely allow React portal after the component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // effect to close the report window with Escape
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeReportWindow();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // effect to auto-close the report window after a successful submission
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  // submits the report to the server
  async function submitReport(e) {
    e.preventDefault();

    if (loading) {
      return;
    }

    // initialize state for new submission
    setLoading(true);
    setError("");
    setMessage("");

    // try to fetch and handle response
    try {
      const res = await fetch(`/api/posts/${postId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      });

      // if response is not ok, try to read error message and throw
      if (!res.ok) {
        throw new Error(await readErrorMessage(res));
      }

      // if successful, read response data and update message state
      const data = await res.json();

      onReported?.(data);
      setMessage(data.message || "Report received and queued for review.");

      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }

      closeTimerRef.current = setTimeout(() => {
        updateOpen(false);
        resetForm();
        closeTimerRef.current = null;
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  }

  const reportWindow =
    mounted && open
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/45 px-4 py-6 backdrop-blur-sm"
            onClick={closeReportWindow}
          >
            <div
              className="relative z-[10000] w-full max-w-md rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-[0_30px_90px_rgba(0,0,0,0.65)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                    Report this event
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    Choose the closest reason. Reports are queued for review and can hide repeat-problem posts from the map/feed.
                  </p>
                </div>

                {/* close button */}
                <button
                  type="button"
                  onClick={closeReportWindow}
                  className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-sm font-semibold text-zinc-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-200"
                  aria-label="Close report window"
                >
                  ×
                </button>
              </div>

              <form onSubmit={submitReport} className="space-y-4">
                <div className="space-y-2">
                  {REPORT_REASONS.map((option) => (
                    <label
                      key={option.categoryId}
                      className={[
                        "flex cursor-pointer gap-3 rounded-2xl border p-3 transition",
                        reason === option.categoryId
                          ? "border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/35"
                          : "border-zinc-200 bg-white hover:border-rose-200 hover:bg-rose-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-rose-900 dark:hover:bg-rose-950/20",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name={`report-reason-${postId}`}
                        value={option.categoryId}
                        checked={reason === option.categoryId}
                        onChange={(e) => setReason(e.target.value)}
                        className="mt-1 accent-rose-500"
                      />

                      <span>
                        <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {option.label}
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>

                {/* could be useful */}
                {/* 
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Optional note for moderators"
                  className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-rose-800 dark:focus:ring-rose-950/40"
                />
                */}

                {error ? (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    {error}
                  </p>
                ) : null}

                {message ? (
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {message}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={loading || !reason}
                  className="w-full rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  {loading ? "Submitting…" : "Submit report"}
                </button>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={toggleReportWindow}
        className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-200"
      >
        Report
      </button>

      {reportWindow}
    </>
  );
}