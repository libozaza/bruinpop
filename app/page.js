import MapClient from "@/components/MapClient";
import Feed from "@/components/Feed";
import PostComposer from "@/components/PostComposer";

export default function Home() {
  return (
    <main className="flex h-screen w-screen overflow-hidden">
      {/* Left sidebar: composer + feed */}
      <aside className="flex w-96 flex-shrink-0 flex-col gap-4 overflow-y-auto border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          BruinPop
        </h1>
        <PostComposer />
        <hr className="border-zinc-200 dark:border-zinc-800" />
        <Feed />
      </aside>

      {/* Right: full-screen map */}
      <div className="relative flex-1">
        <MapClient />
      </div>
    </main>
  );
}
