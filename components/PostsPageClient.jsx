"use client";

import dynamic from "next/dynamic";

// GenAI-assisted (Cursor): Next.js 16 Leaflet client boundary. Prompt: "Fix enqueueModel/null by making
// app/posts/page.js a thin server component that renders PostsPageClient ('use client') which dynamic-imports
// PostsMapShell with ssr:false and a loading skeleton—never import leaflet/react-leaflet in server files."
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
