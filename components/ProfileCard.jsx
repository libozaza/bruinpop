// components/ProfileCard.js
"use client";

const DEFAULT_AVATAR = "/default-avatar.png"; // put a placeholder image in /public/

export default function ProfileCard({ user }) {
  const { username, bio, profilePicture, hypeScore, createdAt } = user;
  const hype = hypeScore ?? 0;

  const joinDate = createdAt ? new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : null;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center gap-4 max-w-sm w-full">
      {/* Avatar */}
      <img
        src={profilePicture || DEFAULT_AVATAR}
        alt={`${username}'s profile picture`}
        onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
        className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
      />

      {/* Name + Hype badge */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">{username}</h2>
        <span className="inline-block mt-1 bg-yellow-100 text-yellow-700 text-sm font-semibold px-3 py-0.5 rounded-full">
          🔥 {hype} hype
        </span>
      </div>

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