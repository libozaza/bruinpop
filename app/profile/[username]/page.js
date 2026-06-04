// app/profile/[username]/page.js
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import ProfileCard from "@/components/ProfileCard";
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

  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.name === username;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
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
      <Link
        href="/"
        className="mt-3 text-sm text-gray-500 hover:underline"
      >
        ← Back to map
      </Link>
    </main>
  );
}