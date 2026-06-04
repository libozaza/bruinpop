"use client";

import dynamic from "next/dynamic";

const PostsMapShell = dynamic(() => import("@/components/PostsMapShell"), {
  ssr: false,
  loading: () => (
    <main className="flex h-[calc(100vh-49px)] w-screen items-center justify-center bg-white dark:bg-zinc-950">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Loading campus map…
      </p>
    </main>
  ),
});

export default function PostsPageClient() {
  return <PostsMapShell />;
}
