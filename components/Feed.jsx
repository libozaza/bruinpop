"use client";
import { useState, useEffect } from "react";

export default function Feed() {
    const [posts, setPosts] = useState([]); 

    // currently polls every 5 seconds. TODO: consider using WebSockets or Server-Sent Events for real-time updates instead of polling
    useEffect(() => {
      let timeoutId;

      const fetchPosts = async () => {
        try {
          const res = await fetch("/api/posts");
          const data = await res.json();
          setPosts(data);
        } catch (err) {
          console.error("Failed to fetch posts:", err);
        } finally {
          timeoutId = setTimeout(fetchPosts, 5000);
        }
      };

      fetchPosts();
      
      // cleanup function to clear the timeout when the component unmounts
      return () => clearTimeout(timeoutId);
    }, []);

    return (
        <div className="space-y-4">
            {posts.map((post, index) => (
                <article
                  key={post.id}
                  className="group rounded-[1.5rem] border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-sm font-semibold text-white shadow-sm">
                          {post.creatorUsername.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            @{post.creatorUsername}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Campus host · post #{index + 1}
                          </p>
                        </div>
                      </div>

                      <h3 className="max-w-xl text-lg font-semibold leading-7 text-zinc-950 dark:text-zinc-50">
                        {post.title}
                      </h3>
                      <p className="max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                        {post.content}
                      </p>
                    </div>

                    <div className="hidden rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 md:block">
                      Preview
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                    <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                    <span>Looks ready for likes, RSVP, and comments</span>
                  </div>
                </article>
            ))}
        </div>
    );
}