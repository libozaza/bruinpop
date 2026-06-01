import MapClient from "@/components/MapClient";
import Feed from "@/components/Feed";
import PostComposer from "@/components/PostComposer";

export const metadata = {
  title: "BruinPop · Campus Events",
  description: "Find and post campus events at UCLA",
};

export default function PostsPage() {
  return (
    <main className="flex h-[calc(100vh-49px)] w-screen overflow-hidden">
      <aside className="flex w-96 flex-shrink-0 flex-col gap-4 overflow-y-auto border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <PostComposer />
        <hr className="border-zinc-200 dark:border-zinc-800" />
        <Feed />
      </aside>
      <div className="relative flex-1">
        <MapClient />
      </div>
    </main>
  );
}