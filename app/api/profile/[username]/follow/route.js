import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(request, { params }) {
    try {
        const { username } = await params;
        const token = await getToken({ req: request });

        if (!token?.id) {
            return NextResponse.json({ error: "Must be logged in to follow" }, { status: 401 });
        }

        await connectDB();

        const targetUser = await User.findOne({ username });
        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // [Gen AI use] Prompt: What code structure should I add here to prevent a user from following themselves, and to prevent a user from following someone they are already following? Implement this within the POST function for following a user in the profile API routes: (placed current code here). 
        // [GenAI Use] LLM Response Start
        if (String(targetUser._id) === String(token.id)) {
            return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
        }

        const alreadyFollowing = targetUser.followers.some(
            (id) => String(id) === String(token.id)
        );

        if (alreadyFollowing) {
            return NextResponse.json({ error: "Already following" }, { status: 400 });
        }
        // [GenAI Use] LLM Response End
        // [GenAI Use] Reflection: I did this because I was unfamiliar with targetUser.followers.some code logic. Added checks to prevent unlogical user following behavior to ensure proper data management and user experience. Was not sure if return message would be appropriate but deeemed the AI given error message to be good enough for now.

        // Add current user to target's followers
        await User.findByIdAndUpdate(targetUser._id, {
            $push: { followers: token.id },
        });

        // Add target to current user's following
        await User.findByIdAndUpdate(token.id, {
            $push: { following: targetUser._id },
        });

        return NextResponse.json({ following: true }, { status: 200 });
    } catch (err) {
        console.error("Follow error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// unfollow a user
export async function DELETE(request, { params }) {
    try {
        const { username } = await params;
        const token = await getToken({ req: request });

        if (!token?.id) {
            return NextResponse.json({ error: "Must be logged in to unfollow" }, { status: 401 });
        }

        await connectDB();

        const targetUser = await User.findOne({ username });
        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // remove current user from target's followers
        await User.findByIdAndUpdate(targetUser._id, {
            $pull: { followers: token.id },
        });

        // remove target from current user's following 
        await User.findByIdAndUpdate(token.id, {
            $pull: { following: targetUser._id },
        });

        return NextResponse.json({ following: false }, { status: 200 });
    } catch (err) {
        console.error("Unfollow error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}