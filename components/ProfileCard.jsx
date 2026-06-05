// components/ProfileCard.js
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import HostCredibility from "@/components/HostCredibility";
import { getTierPayload } from "@/lib/hype/tiers";

const DEFAULT_AVATAR = "/default-avatar.svg";

// [Gen AI use] Prompt: Create a main profile display page that shows relavant user information in a clean front end display (following what is already implemented), info such as profile picture, username, bio, join date, and follower/following counts, hype score, host credibility, etc.
// [GenAI Use] LLM Response Start
export default function ProfileCard({ user }) {
  const { username, bio, profilePicture, hypeScore, createdAt, followerCount, followingCount } = user;
  const hostHype = getTierPayload(hypeScore ?? 0);
  const { data: session } = useSession();
  const router = useRouter();

  // [Gen AI use] Prompt: The user does not have a way to see their followers and following lists. Implement a way for the user to click on the follower and following counts to see a list of their followers and following.
  // [GenAI Use] LLM Response Start
  const isOwnProfile = session?.user?.name === username;
  const initiallyFollowing = user.followerIds?.includes(session?.user?.id) ?? false;

  const [following, setFollowing] = useState(initiallyFollowing);
  const [followerCountState, setFollowerCountState] = useState(followerCount ?? 0);
  const [followLoading, setFollowLoading] = useState(false);

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  // [Gen AI Use] LLM Response End
  // [Gen AI Use] Reflection: This generated code added new state variables to track the followers/following lists and the loading state of the follow/unfollow button, as well as an API call to follow/unfollow, which I had to manually route/create code for in the backend after discussion with the team.

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

  // [Gen AI use] Prompt: Implement a default profile picture in case the user does not have one. Have proper error handling and fallbacks in case the profile picture URL is invalid or fails to load.
  // [Gen AI Use] LLM Response Start
  // [Gen AI Use] LLM End (line 79)
  // [Gen AI Use] Reflection: I was unfamiliar with the syntax of an onError handler. I checked the logic and realized that the onError handler triggered if the image failed to load, and then set the profile picture source to the default avatar.
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

// [GenAI Use] LLM Response End
// [GenAI Use] Reflection: Overall, the AI did a good job implementing the profile card with all the relevant information and features. I only modified styling of the text color since it was a little too light and hard to see against the white background.