// components/ProfileCard.js
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import HostCredibility from "@/components/HostCredibility";
import { getTierPayload } from "@/lib/hype/tiers";

const DEFAULT_AVATAR = "/default-avatar.svg";

export default function ProfileCard({ user }) {
  const { username, bio, profilePicture, hypeScore, createdAt, followerCount, followingCount } = user;
  const hostHype = getTierPayload(hypeScore ?? 0);
  const { data: session } = useSession();
  const router = useRouter();

  const isOwnProfile = session?.user?.name === username;
  const initiallyFollowing = user.followerIds?.includes(session?.user?.id) ?? false;

  const [following, setFollowing] = useState(initiallyFollowing);
  const [followerCountState, setFollowerCountState] = useState(followerCount ?? 0);
  const [followLoading, setFollowLoading] = useState(false);

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const joinDate = createdAt ? new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : null;

  async function handleFollow(){
    if(!session) {
      router.push("/login");
      return;
    }
    
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/profile/${username}/follow`, {
        method: following ? "DELETE" : "POST",
      });

      if(!res.ok){
        const data = await res.json().catch(() => null);
        console.error(data?.error || "Failed to follow/unfollow");
        return
      }

      setFollowing((prev) => !prev);
      setFollowerCountState((prev) => prev + (following ? -1 : 1));
    } catch (err) {
      console.error("Error following/unfollowing:", err);
    } finally {
      setFollowLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center gap-4 max-w-sm w-full">
      {/* Avatar */}
      <img
        src={profilePicture || DEFAULT_AVATAR}
        alt={`${username}'s profile picture`}
        onError={(e) => {
          if (!e.currentTarget.src.endsWith(DEFAULT_AVATAR)) {
            e.currentTarget.src = DEFAULT_AVATAR;
          }
        }}
        className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
      />

      {/* Name + Hype badge */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">{username}</h2>
        <div className="mt-2 flex justify-center">
          <HostCredibility hostHype={hostHype} showScore />
        </div>
      </div>

      {/* Follower / Following counts */}
      <div className="flex gap-6 text-center">
        <button
          onClick={() => { setShowFollowers((v) => !v); setShowFollowing(false);  }}
          className="flex flex-col items-center hover:opacity-70 transition"
        >
          <p className="text-sm font-semibold text-gray-800">{followerCountState}</p>
          <p className="text-xs text-gray-400">Followers</p>
        </button>
          
        <button
          onClick={() => { setShowFollowing((v) => !v); setShowFollowers(false); }}
          className="flex flex-col items-center hover:opacity-70 transition"
        >
          <p className="text-sm font-semibold text-gray-800">{followingCount ?? 0}</p>
          <p className="text-xs text-gray-400">Following</p>
        </button>
      </div>

      {/*Followers List*/}
      {showFollowers && (
        <div className="w-full border border-gray-200 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Followers</p>
          {user.followerList?.length ? (
            user.followerList.filter((f) => f?.username).map((f) => (
              <a
                key={f.id}
                href={`/profile/${f.username}`}
                className="flex items-center gap-3 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {f.username.slice(0, 1).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-800">@{f.username}</span>
              </a>
            ))
          ) : (
            <p className="text-xs text-gray-400 italic">No followers yet.</p>
          )}
        </div>
      )}

      {/*Following List*/}
      {showFollowing && (
        <div className="w-full border border-gray-200 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Following</p>
          {user.followingList?.length ? (
            user.followingList.filter((f) => f?.username).map((f) => (
              <a
                key={f.id}
                href={`/profile/${f.username}`}
                className="flex items-center gap-3 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {f.username.slice(0, 1).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-800">@{f.username}</span>
                {isOwnProfile && (
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      await fetch(`/api/profile/${f.username}/follow`, { method: "DELETE" });
                      window.location.reload();
                    }}
                    className="ml-auto text-xs text-rose-500 hover:text-rose-700"
                  >
                    Unfollow
                  </button>
                )}
              </a>
            ))
          ) : (
            <p className="text-xs text-gray-400 italic">Not following anyone yet.</p>
          )}
        </div>
      )}

      {/* Follow/unfollow button */}
      {!isOwnProfile && (
        <button
          onClick={handleFollow}
          disabled={followLoading}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition disabled:opacity-50 ${
            following
              ? "border border-gray-300 text-gray-600 hover:bg-gray-50"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {followLoading ? "..." : following ? "Unfollow" : "Follow"}
        </button>
      )}

      {/* Bio */}
      {bio ? (
        <p className="text-gray-600 text-center text-sm">{bio}</p>
      ) : (
        <p className="text-gray-400 text-center text-sm italic">No bio yet.</p>
      )}

      {/* Join date */}
      {joinDate && (
        <p className="text-gray-400 text-xs">Joined {joinDate}</p>
      )}
    </div>
  );
}