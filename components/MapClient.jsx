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
  const subscribedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function loadPosts() {
      try {
        const res = await fetch("/api/posts");
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setPosts(data);
      } catch (err) {
        console.error("Failed to load map events:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPosts();

    const pusher = getPusherClient();
    if (pusher && !subscribedRef.current) {
      subscribedRef.current = true;
      const channel = pusher.subscribe("posts");
      const handler = (incoming) => {
        setPosts((prev) => {
          if (prev.some((p) => p.id === incoming.id)) return prev;
          return [incoming, ...prev];
        });
      };
      channel.bind("post.created", handler);
      return () => {
        mounted = false;
        channel.unbind("post.created", handler);
        subscribedRef.current = false;
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const mapEvents = useMemo(() => postsToMapEvents(posts), [posts]);

  return (
    <div className="absolute inset-0">
      <MapView events={mapEvents} />
      {loading ? (
        <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-2 text-xs text-zinc-600 shadow dark:bg-zinc-900/90 dark:text-zinc-300">
          Loading map events…
        </div>
      ) : null}
      {!loading && mapEvents.length === 0 ? (
        <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-lg border border-dashed border-zinc-300 bg-white/95 px-3 py-2 text-xs text-zinc-600 shadow dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-300">
          No events with map locations yet. Posts need latitude and longitude to
          appear here.
        </div>
      ) : null}
    </div>
  );
}
