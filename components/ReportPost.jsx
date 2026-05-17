"use client";

import { useState } from "react";
import { REPORT_REASONS } from "@/lib/posts/moderation.js";

export default function ReportPost({ postId, onReported }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]?.categoryId ?? "");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function readErrorMessage(response) {
    const data = await response.json().catch(() => null);
    return data?.error || `Request failed with status ${response.status}`;
  }

  async function submitReport(e) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/posts/${postId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      });

      if (!res.ok) {
        throw new Error(await readErrorMessage(res));
      }

      const data = await res.json();
      setMessage(data.message || "Report received and queued for review.");
      setDetails("");
      onReported?.(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          setMessage("");
          setError("");
        }}
        className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-200"
      >
        Report
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Report this event
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Choose the closest reason. Reports are queued for review and can hide repeat-problem posts from the map/feed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              aria-label="Close report menu"
            >
              ×
            </button>
          </div>

          <form onSubmit={submitReport} className="space-y-3">
            <div className="space-y-2">
              {REPORT_REASONS.map((option) => (
                <label
                  key={option.categoryId}
                  className="flex cursor-pointer gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3 transition hover:border-rose-200 hover:bg-rose-50 dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-rose-900 dark:hover:bg-rose-950/30"
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
                    <span className="block text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Optional note for moderators"
              className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-rose-800 dark:focus:ring-rose-950/40"
            />

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
              disabled={loading}
              className="w-full rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {loading ? "Submitting…" : "Submit report"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
