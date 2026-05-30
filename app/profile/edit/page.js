"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      setLoading(false);
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.name) {
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await fetch(`/api/profile/${session.user.name}`);
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(data.error || "Could not load profile.");
          setLoading(false);
          return;
        }

        if (!data.user) {
          setError("Profile not found.");
          setLoading(false);
          return;
        }

        setBio(data.user.bio || "");
        setProfilePicture(data.user.profilePicture || "");
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Network error. Could not load profile.");
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.name]);

    const handleSave = async () => {
        setError("");
        setSuccess(false);

        if(bio.length > 300){
            setError("Bio must be 300 characters or less.");
            setSaving(false);
            return;
        }

        setSaving(true);
        try{
            const res = await fetch("/api/profile/update", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ bio, profilePicture }),
            });
            const data = await res.json();
            if(!res.ok){
                setError(data.error || "An error occurred while saving.");
            } 
            else{
                setSuccess(true);
                setTimeout(() => router.push(`/profile/${session.user.name}`), 1000);
            }  
        }
        catch {
            setError("Network error. Please try again.");
        }
        finally {
            setSaving(false);
        }
    };

    if(status === "loading" || loading){
        return (
        <main className="flex items-center justify-center h-screen">
            Loading...
        </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
            <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md flex flex-col gap-6">
                <h1 className="text-2xl font-bold text-gray-800 text-center">Edit Profile</h1>

                {/* Profile Picture URL */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">
                        Profile Picture URL
                    </label>
                    <input
                        type="url"
                        value={profilePicture}
                        onChange={(e) => setProfilePicture(e.target.value)}
                        placeholder="https://example.com/your-photo.jpg"
                        className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    {/* Live preview */}
                    {profilePicture && (
                        <img
                            src={profilePicture}
                            alt="Preview"
                            onError={(e) => { e.target.style.display = "none"; }}
                            className="mt-2 w-20 h-20 rounded-full object-cover self-center border-2 border-blue-200"
                        />
                    )}
                </div>

                {/* Bio */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">
                        Bio{" "}
                        <span className={`font-normal ${bio.length > 300 ? "text-red-500" : "text-gray-400"}`}>
                            ({bio.length}/300)
                        </span>
                    </label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell people about yourself…"
                        rows={4}
                        className="border border-gray-300 rounded-lg px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {/* Error / Success messages */}
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                {success && <p className="text-green-500 text-sm text-center">Saved! Redirecting…</p>}

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-full text-sm font-semibold hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || bio.length > 300}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </main>
    );
};