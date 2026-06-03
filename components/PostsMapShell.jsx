"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Feed from "@/components/Feed";

const PostComposer = dynamic(() => import("@/components/PostComposer"), {
  ssr: false,
  loading: () => (
    <div className="h-40 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
  ),
});

const MapClient = dynamic(() => import("@/components/MapClient"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
  ),
});

/**
 * Client shell for /posts — shares draft pin state between composer sidebar and main map.
 * Leaflet maps only mount after the browser is ready (avoids RSC/hydration crashes).
 */
export default function PostsMapShell() {
  const [ready, setReady] = useState(false);
  const [draftPin, setDraftPin] = useState(null);

  useEffect(() => {
    setReady(true);
  }, []);

  const handleDraftPinChange = useCallback((pin) => {
    setDraftPin(pin);
  }, []);

  if (!ready) {
    return (
      <main className="flex h-[calc(100vh-49px)] w-screen items-center justify-center bg-white dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading campus map…
        </p>
      </main>
    );
  }

  return (
    <main className="flex h-[calc(100vh-49px)] w-screen overflow-hidden">
      <aside className="flex w-[min(100%,28rem)] flex-shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Create event
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Set a location below — the big map updates live as you type or drag.
          </p>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <PostComposer onDraftPinChange={handleDraftPinChange} />
          <hr className="border-zinc-200 dark:border-zinc-800" />
          <Feed />
        </div>
      </aside>
      <div className="relative min-w-0 flex-1">
        <MapClient draftPin={draftPin} />
      </div>
    </main>
  );
}
