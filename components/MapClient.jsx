"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { getPusherClient } from "@/lib/pusher/pusher-client";
import { postsToMapEvents } from "@/lib/maps/geo.js";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
  ),
});

export default function MapClient() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const channelRef = useRef(null);
  const subscribedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function loadPosts() {
      try {
        setFetchError("");
        const res = await fetch("/api/posts");
        if (!res.ok) {
          throw new Error(`Failed to load posts (${res.status})`);
        }
        const data = await res.json();
        if (mounted) setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load map events:", err);
        if (mounted) {
          setFetchError("Could not load events for the map.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPosts();

    const pusher = getPusherClient();
    if (!pusher) {
      return () => {
        mounted = false;
      };
    }

    if (subscribedRef.current) {
      return () => {
        mounted = false;
      };
    }
    subscribedRef.current = true;

    const channel = pusher.subscribe("posts");
    channelRef.current = channel;

    const createdHandler = (incoming) => {
      setPosts((prev) => {
        if (prev.some((p) => p.id === incoming.id)) return prev;
        return [incoming, ...prev];
      });
    };

    const deletedHandler = (incoming) => {
      if (!incoming?.postId) return;
      setPosts((prev) =>
        prev.filter((post) => String(post.id) !== String(incoming.postId)),
      );
    };

    channel.bind("post.created", createdHandler);
    channel.bind("post.deleted", deletedHandler);

    const onStateChange = (states) => {
      if (states.current === "connected") {
        loadPosts();
      }
    };
    pusher.connection.bind("state_change", onStateChange);

    return () => {
      mounted = false;
      if (channelRef.current) {
        channelRef.current.unbind("post.created", createdHandler);
        channelRef.current.unbind("post.deleted", deletedHandler);
        try {
          pusher.unsubscribe("posts");
        } catch (e) {}
      }
      pusher.connection.unbind("state_change", onStateChange);
      subscribedRef.current = false;
    };
  }, []);

  const mapEvents = useMemo(() => postsToMapEvents(posts), [posts]);

  const postsWithoutCoords = posts.length - mapEvents.length;

  return (
    <div className="absolute inset-0">
      <MapView events={mapEvents} />

      {loading ? (
        <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-2 text-xs text-zinc-600 shadow dark:bg-zinc-900/90 dark:text-zinc-300">
          Loading map events…
        </div>
      ) : null}

      {!loading && fetchError ? (
        <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 shadow dark:border-rose-900 dark:bg-rose-950/90 dark:text-rose-200">
          {fetchError}
        </div>
      ) : null}

      {!loading && !fetchError && mapEvents.length > 0 ? (
        <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-2 text-xs font-medium text-zinc-700 shadow dark:bg-zinc-900/90 dark:text-zinc-200">
          {mapEvents.length} event{mapEvents.length === 1 ? "" : "s"} on map
        </div>
      ) : null}

      {!loading && !fetchError && posts.length === 0 ? (
        <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-lg border border-dashed border-zinc-300 bg-white/95 px-3 py-2 text-xs text-zinc-600 shadow dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-300">
          No events posted yet. Create one in the sidebar to get started.
        </div>
      ) : null}

      {!loading && !fetchError && posts.length > 0 && mapEvents.length === 0 ? (
        <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-lg border border-dashed border-zinc-300 bg-white/95 px-3 py-2 text-xs text-zinc-600 shadow dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-300">
          {posts.length} event{posts.length === 1 ? "" : "s"} in the feed, but
          none have map coordinates yet. Posts need{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            location.lat
          </code>{" "}
          /{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            location.lng
          </code>{" "}
          to show pins.
        </div>
      ) : null}

      {!loading && !fetchError && postsWithoutCoords > 0 && mapEvents.length > 0 ? (
        <div className="pointer-events-none absolute left-4 top-12 max-w-xs rounded-lg bg-white/80 px-3 py-1.5 text-[11px] text-zinc-500 shadow dark:bg-zinc-900/80 dark:text-zinc-400">
          {postsWithoutCoords} other event{postsWithoutCoords === 1 ? "" : "s"}{" "}
          hidden (no coordinates).
        </div>
      ) : null}
    </div>
  );
}
