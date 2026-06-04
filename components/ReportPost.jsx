"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { REPORT_REASONS } from "@/lib/posts/moderation.js";

const DEFAULT_BUTTON_CLASS =
  "rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-200";

export default function ReportPostButton({
  postId,
  onReported,
  onOpenChange,
  buttonLabel = "Report",
  buttonClassName = DEFAULT_BUTTON_CLASS,
  notifyParentOnSuccess = false,
}) {
  const closeTimerRef = useRef(null);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function readErrorMessage(response) {
    const data = await response.json().catch(() => null);
    return data?.error || `Request failed with status ${response.status}`;
  }

  function resetForm() {
    setReason("");
    setDetails("");
    setMessage("");
    setError("");
    setLoading(false);
  }

  function updateOpen(nextOpen) {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function closeReportWindow() {
    clearCloseTimer();
    updateOpen(false);
    resetForm();
  }

  function openReportWindow() {
    clearCloseTimer();
    resetForm();
    updateOpen(true);
  }

  function toggleReportWindow(event) {
    event?.stopPropagation();

    if (open) {
      closeReportWindow();
      return;
    }

    openReportWindow();
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeReportWindow();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, []);

  async function submitReport(event) {
    event.preventDefault();
    event.stopPropagation();

    if (loading) {
      return;
    }

    if (!postId) {
      setError("Cannot report this post because the post ID is missing.");
      return;
    }

    if (!reason) {
      setError("Choose a report reason first.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/posts/${postId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = await response.json();

      if (notifyParentOnSuccess) {
        onReported?.(data);
      }

      setMessage(data.message || "Report received and queued for review.");

      clearCloseTimer();

      closeTimerRef.current = setTimeout(() => {
        updateOpen(false);
        resetForm();
        closeTimerRef.current = null;
      }, 1200);
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit report",
      );
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
              role="dialog"
              aria-modal="true"
              aria-labelledby={`report-title-${postId}`}
              className="relative z-[10000] w-full max-w-md rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-[0_30px_90px_rgba(0,0,0,0.65)]"
              onClick={(clickEvent) => clickEvent.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3
                    id={`report-title-${postId}`}
                    className="text-base font-semibold text-zinc-950 dark:text-zinc-50"
                  >
                    Report this event
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    Choose the closest reason. Reports are queued for review by
                    moderators.
                  </p>
                </div>

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
                        onChange={(changeEvent) =>
                          setReason(changeEvent.target.value)
                        }
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

                <div className="space-y-1.5">
                  <label
                    htmlFor={`report-details-${postId}`}
                    className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400"
                  >
                    Optional note
                  </label>

                  <textarea
                    id={`report-details-${postId}`}
                    value={details}
                    onChange={(changeEvent) =>
                      setDetails(changeEvent.target.value)
                    }
                    maxLength={500}
                    rows={3}
                    placeholder="Add a short note for moderators"
                    className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-rose-800 dark:focus:ring-rose-950/40"
                  />

                  <p className="text-right text-[11px] text-zinc-400 dark:text-zinc-500">
                    {details.length}/500
                  </p>
                </div>

                {error ? (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/35 dark:text-rose-200">
                    {error}
                  </p>
                ) : null}

                {message ? (
                  <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-200">
                    {message}
                  </p>
                ) : null}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeReportWindow}
                    disabled={loading}
                    className="flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !reason}
                    className="flex-1 rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                  >
                    {loading ? "Submitting…" : "Submit report"}
                  </button>
                </div>
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
        className={buttonClassName}
      >
        {buttonLabel}
      </button>

      {reportWindow}
    </>
  );
}