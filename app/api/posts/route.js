import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import Post from "@/lib/models/Post";
import { getTierPayload } from "@/lib/hype/tiers.js";
import { triggerPostCreated } from "@/lib/pusher/pusher-server";
import User from "@/lib/models/User"; // Only used for the Post GET route's population of creator username and hypeScore
import { formatPost } from "@/lib/posts/format.js";

export async function GET(request) {
    // TODO: change to cap how many posts you get
    try {
        await connectDB();
        // sort posts by creation date in descending order and populate creator's username
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate("creator", "username hypeScore");
        const token = await getToken({ req: request });
        const formattedPosts = await Promise.all(posts.map(p => formatPost(p, token)));
        return NextResponse.json(formattedPosts, { status: 200 });
    } catch (error) {
        console.error("Error fetching posts:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { title, content } = await request.json();
        
        if (!title || !content) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        await connectDB();
        const token = await getToken({ req: request });
        const creatorId = token?.id;
        if (!creatorId) {
            return NextResponse.json({ error: "Must be logged in to create a post" }, { status: 401 });
        }
        const post = new Post({ title, content, creator: creatorId });
        await post.save();
        await post.populate("creator", "username hypeScore");

        const formattedPost = await formatPost(post, token);
        try {
            await triggerPostCreated(formattedPost);
        } catch (error) {
            console.error("Error triggering post created event:", error);
        }

        return NextResponse.json(formattedPost, { status: 201 });
    } catch (error) {
        console.error("Error creating post:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}