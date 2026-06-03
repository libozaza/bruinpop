import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

// follow a user
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

        if (String(targetUser._id) === String(token.id)) {
            return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
        }

        const alreadyFollowing = targetUser.followers.some(
            (id) => String(id) === String(token.id)
        );

        if (alreadyFollowing) {
            return NextResponse.json({ error: "Already following" }, { status: 400 });
        }

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