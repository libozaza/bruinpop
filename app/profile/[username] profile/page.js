// app/profile/[username]/page.js
import { notFound } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import ProfileCard from "@/components/ProfileCard";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function generateMetadata({ params }) {
  return { title: `${params.username} — BruinPop` };
}

export default async function ProfilePage({ params }) {
  const { username } = await params;

  await dbConnect();
  const user = await User.findOne({ username }).select(
    "username bio profilePicture hype createdAt"
  ).lean();

  if(!user){
    notFound();
  }

  const plainUser = {
    ...user,
    _id: user._id.toString(),
    createdAt: user.createdAt?.toISOString() ?? null,
    updatedAt: user.updatedAt?.toISOString() ?? null,
  };

  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.name === username;

// [Gen AI use] Prompt: How can I only show the edit button if this is the logged-in user's own profile?
// [GenAI Use] LLM Response Start
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
// [GenAI Use] LLM Response End
// [GenAI Use] Reflection: Was unsure where to implement this check and had a small brainfart moment where I thought I had to do it in the backend, but then realized it was a simple front end check that could be done by comparing the session username to the profile username. Had to do some debugging later on after some merge conflicts but was able to leave this untouched since the logic was due to backend api routing and unrelated to this frontend check.