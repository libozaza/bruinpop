// app/profile/[username]/page.js
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import Post from "@/lib/models/Post";
import RSVP from "@/lib/models/RSVP";
import ProfileCard from "@/components/ProfileCard";
import ProfileTabs from "@/components/ProfileTabs"; // new module for tabbed content
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function generateMetadata({ params }) {
  const { username } = await params;
  return { title: `${username} — BruinPop` };
}

export default async function ProfilePage({ params }) {
  const { username } = await params;

  await connectDB();
  const user = await User.findOne({ username })
  .select("username bio profilePicture hypeScore createdAt followers following")
  .populate("followers", "username profilePicture")
  .populate("following", "username profilePicture");

  if(!user){
    notFound();
  }

  // Get user's posts
  const posts = await Post.find({ creator: user._id })
    .sort({ createdAt: -1 })
    .select("title content categories date address createdAt")
    .lean();

  // Get user's RSVPs and populate post data
  const rsvps = await RSVP.find({ user: user._id })
    .populate({
      path: "post",
      select: "title content categories date address createdAt",
    })
    .sort({ createdAt: -1 })
    .lean();

  const plainUser = {
    _id: user._id.toString(),
    username: user.username,
    bio: user.bio ?? "",
    profilePicture: user.profilePicture ?? "",
    hypeScore: user.hypeScore ?? 0,
    createdAt: user.createdAt?.toISOString() ?? null,
    updatedAt: user.updatedAt?.toISOString() ?? null,
    followerCount: user.followers?.length ?? 0,
    followingCount: user.following?.length ?? 0,
    followerIds: user.followers?.map((id) => id.toString()) ?? [],
    followerList: user.followers?.map((f) => ({
      id: f._id.toString(),
      username: f.username,
      profilePicture: f.profilePicture ?? "",
    })) ?? [],
    followingList: user.following?.map((f) => ({
      id: f._id.toString(),
      username: f.username,
      profilePicture: f.profilePicture ?? "",
    })) ?? [],
  };

  const plainPosts = posts.map((p) => ({
    id: p._id.toString(),
    title: p.title,
    content: p.content,
    categories: p.categories ?? [],
    date: p.date ? new Date(p.date).toISOString() : null,
    address: p.address ?? "",
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
  }));

  const plainRsvps = rsvps
    .filter((r) => r.post)
    .map((r) => ({
      id: r.post._id.toString(),
      title: r.post.title,
      content: r.post.content,
      categories: r.post.categories ?? [],
      date: r.post.date ? new Date(r.post.date).toISOString() : null,
      address: r.post.address ?? "",
      createdAt: r.post.createdAt ? new Date(r.post.createdAt).toISOString() : null,
    }));

  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.name === username;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">

      <div className="mx-auto max-w-5xl flex flex-col lg:flex-row gap-8 items-start">

      {/* Profile card on the left */}
      <div className="flex flex-col items-center gap-4 w-full lg:w-80 flex-shrink-0">
        <ProfileCard user={plainUser} />

        {/* Only show Edit button if this is the logged-in user's own profile */}
        {isOwner && (
          <Link
            href="/profile/edit"
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition"
          >
            Edit Profile
          </Link>
        )}

        {/* Back to map/feed */}
        <Link href="/" className="mt-3 text-sm text-gray-500 hover:underline">
          ← Back to map
        </Link>
      </div>
    
      {/* Tabbed content on the right */}
      <div className="flex-1 w-full">
        <ProfileTabs posts={plainPosts} rsvps={plainRsvps} />
      </div>
    </div>
  </main>
);
}