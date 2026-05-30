"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher/pusher-client";
import { combinedFeedRankScore } from "@/lib/hype";
import Post from "@/components/Post";

export default function Feed() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const channelRef = useRef(null);
  const subscribedRef = useRef(false);

  function getPostBaseScore(createdAt) {
    const createdMs = new Date(createdAt).getTime();
    if (!Number.isFinite(createdMs)) return 0;
    const ageHours = (Date.now() - createdMs) / (1000 * 60 * 60);
    return Math.max(0, 200 - ageHours);
  }

  function scorePost(post) {
    const base = getPostBaseScore(post.createdAt);
    const hypeScore = post.hostHype?.hypeScore ?? 0;
    return combinedFeedRankScore(base, hypeScore);
  }

  function sortPostsByRank(postsList) {
    return [...postsList].sort((a, b) => {
      const scoreDiff = scorePost(b) - scorePost(a);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function mergeIncoming(prev, incoming) {
    if (prev.some((p) => p.id === incoming.id)) return prev;
    return sortPostsByRank([incoming, ...prev]);
  }

  function handlePostClick(postId) {
    router.push(`/posts/${postId}`);
  }

  useEffect(() => {
    let mounted = true;

    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/posts");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setPosts(sortPostsByRank(data));
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      }
    };

    fetchPosts();

    const pusher = getPusherClient();
    if (!pusher) return () => { mounted = false; };

    if (subscribedRef.current) return () => { mounted = false; };
    subscribedRef.current = true;

    const channel = pusher.subscribe("posts");
    channelRef.current = channel;

    const createdHandler = (incoming) => {
      setPosts((prev) => mergeIncoming(prev, incoming));
    };

    const deletedHandler = (incoming) => {
      if (!incoming?.postId) return;
      setPosts((prev) => prev.filter((post) => String(post.id) !== String(incoming.postId)));
    };

    channel.bind("post.created", createdHandler);
    channel.bind("post.deleted", deletedHandler);

    const onStateChange = (states) => {
      if (states.current === "connected") {
        fetchPosts();
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

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          No posts yet.
        </div>
      ) : null}

      {posts.map((post, index) => (
        <Post
          key={post.id}
          post={post}
          index={index}
          handlePostClick={handlePostClick}
        />
      ))}
    </div>
  );
}