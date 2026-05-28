import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getToken } from "next-auth/jwt";
import Post from "@/lib/models/Post";
import Vote from "@/lib/models/Vote";
import User from "@/lib/models/User"; // Only used for the Post GET route's population of creator username and hypeScore
import { formatPost } from "@/lib/posts/format.js";
import { triggerVoteUpdated } from "@/lib/pusher/pusher-server.js";

export async function GET(_request, { params }) {
    try {
        const { id } = await params;
        await connectDB();
        const post = await Post.findById(id).populate("creator", "username hypeScore");

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const formattedPost = formatPost(post);
        return NextResponse.json(formattedPost, { status: 200 });
    } catch (error) {
        console.error("Error fetching post:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const { action } = await request.json();

        if (!action) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        await connectDB();
        const post = await Post.findById(id);

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const token = await getToken({ req: request });
        const userId = token?.id;
        if (!userId) {
            return NextResponse.json({ error: "Must be logged in to vote" }, { status: 401 });
        }

        if (action === "upvote") {
            const existingVote = await Vote.findOne({ user: userId, post: id });
            if (existingVote && existingVote.value === 1) {
                try {
                    await Vote.findOneAndDelete({ user: userId, post: id });
                    await triggerVoteUpdated(id);
                } catch (error) {
                    console.error("Error removing vote:", error);
                    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
                }
            }
            else if (existingVote && existingVote.value === -1) {
                try {
                    await Vote.findOneAndUpdate({ user: userId, post: id }, { value: 1 });
                    await triggerVoteUpdated(id);
                } catch (error) {
                    console.error("Error updating vote:", error);
                    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
                }
            }
            else {
                try {
                    await new Vote({ user: userId, post: id, value: 1 }).save();
                    await triggerVoteUpdated(id);
                } catch (error) {
                    console.error("Error creating vote:", error);
                    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
                }
            }
        } else if (action === "downvote") {
            const existingVote = await Vote.findOne({ user: userId, post: id });
            if (existingVote && existingVote.value === -1) {
                try {
                    await Vote.findOneAndDelete({ user: userId, post: id });
                    await triggerVoteUpdated(id);
                } catch (error) {
                    console.error("Error removing vote:", error);
                    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
                }
            }
            else if (existingVote && existingVote.value === 1) {
                try {
                    await Vote.findOneAndUpdate({ user: userId, post: id }, { value: -1 });
                    await triggerVoteUpdated(id);
                } catch (error) {
                    console.error("Error updating vote:", error);
                    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
                }
            }
            else {
                try {
                    await new Vote({ user: userId, post: id, value: -1 }).save();
                    await triggerVoteUpdated(id);
                } catch (error) {
                    console.error("Error creating vote:", error);
                    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
                }
            }
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
        await post.save();
        const formattedPost = await formatPost(post);
        return NextResponse.json(formattedPost, { status: 200 });   
    } catch (error) {
        console.error("Error updating post:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}