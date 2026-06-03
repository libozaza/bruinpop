"use client";

import { useCallback, useState } from "react";
import MapClient from "@/components/MapClient";
import Feed from "@/components/Feed";
import PostComposer from "@/components/PostComposer";

/**
 * Client shell for /posts — shares draft pin state between composer sidebar and main map.
 */
export default function PostsMapShell() {
  const [draftPin, setDraftPin] = useState(null);

  const handleDraftPinChange = useCallback((pin) => {
    setDraftPin(pin);
  }, []);

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
