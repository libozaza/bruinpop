"use client";
import { useState, useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher/pusher-client";
import { useRouter } from "next/navigation";
import Post from "@/components/Post";

export default function Feed() {
  const router = useRouter();
  const [posts, setPosts] = useState([]); 
  const channelRef = useRef(null);
  const subscribedRef = useRef(false);

  // helper: merge + dedupe + sort (desc by createdAt)
  function mergeIncoming(prev, incoming) {
    if (prev.some((p) => p.id === incoming.id)) return prev;
    const merged = [incoming, ...prev];
    merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return merged;
  }

  function handlePostClick(postId) {
    router.push(`/posts/${postId}`);
  }

  // TODO: get new posts once you have scrolled to bottom of feed (infinite scroll)
  useEffect(() => {
    let mounted = true;

    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/posts");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPosts(data);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      }
    };

    fetchPosts();

    const pusher = getPusherClient();
    if (!pusher) return () => { mounted = false; };

    // guard against double subscriptions
    if (subscribedRef.current) return () => { mounted = false; };
    subscribedRef.current = true;

    const channel = pusher.subscribe("posts");
    channelRef.current = channel;

    const handler = (incoming) => {
      // incoming format: { id, title, content, creatorUsername, createdAt }
      setPosts((prev) => mergeIncoming(prev, incoming));
    };

    const deleteHandler = (incoming) => {
      if (!incoming?.postId) return;
      setPosts((prev) => prev.filter((post) => String(post.id) !== String(incoming.postId)));
    };

    channel.bind("post.created", handler);
    channel.bind("post.deleted", deleteHandler);

    // refetch posts on reconnect to capture any missed events while disconnected
    const onStateChange = (states) => {
      if (states.current === "connected") {
        fetchPosts(); // resync missed events
      }
    };
    pusher.connection.bind("state_change", onStateChange);

    // cleanup on unmount
    return () => {
      mounted = false;
      if (channelRef.current) {
        channelRef.current.unbind("post.created", handler);
        channelRef.current.unbind("post.deleted", deleteHandler);
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