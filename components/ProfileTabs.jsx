"use client";

import { useState } from "react";
import Link from "next/link";

// [Gen AI use] Prompt: I want to rework the profile page where you can see the posts you've made and the events you've rsvped to, side to side. I want it alongside the profile information where the empty space is, what do I need to do and teach me how to do it? The posts and rsvps should be displayed as two tabs where you can click posts or rsvps to switch. The posts carts should be a simple preview card with the title, date, category, and any other relavant simple information that could be previewed.
// [GenAI Use] LLM Response Start

function PostPreviewCard({ post }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="block rounded-2xl border border-zinc-200 bg-white p-4 hover:shadow-md transition dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-wrap gap-2 mb-2">
        {post.categories?.map((cat) => (
          <span
            key={cat}
            className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700"
          >
            {cat}
          </span>
        ))}
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
        {post.title}
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
        {post.content}
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400 dark:text-zinc-500">
        {post.date && (
          <span>📅 {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        )}
        {post.address && <span>📍 {post.address}</span>}
      </div>
    </Link>
  );
}

export default function ProfileTabs({ posts, rsvps }) {
  const [activeTab, setActiveTab] = useState("posts");

  const items = activeTab === "posts" ? posts : rsvps;

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            activeTab === "posts"
              ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
              : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400"
          }`}
        >
          Posts ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab("rsvps")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            activeTab === "rsvps"
              ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
              : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400"
          }`}
        >
          RSVPs ({rsvps.length})
        </button>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
          {activeTab === "posts" ? "No posts yet." : "No RSVPs yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((post) => (
            <PostPreviewCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
// [GenAI Use] LLM Response End
// [GenAI Use] Reflection: I had to follow up the code from the previous prompt that modified app/profile/[username]/page.js to implement a new ProfileTabs component that actually displayed two tabs I structured the component to have two tabs that go between posts and RSVPs and I also needed a simple PostPreviewCard component to display the relevant information for each post. I decided to keep what the AI gave me since this was necessary to implement, and I also thought the front end looked decent enough. I had to make sure the correct props were passed from the profile page to this new component.