import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import Post from "@/lib/models/Post";
import User from "@/lib/models/User";

function formatPost(post) {
    return {
        id: String(post._id),
        title: post.title,
        content: post.content,
        creatorUsername: post.creator?.username ?? "null",
        createdAt: post.createdAt,
    };
}

export async function GET() {
    try {
        await connectDB();
        // sort posts by creation date in descending order and populate creator's username
        const posts = await Post.find().sort({ createdAt: -1 }).populate('creator', 'username');
        const formattedPosts = posts.map(formatPost);
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
        await post.populate('creator', 'username');

        return NextResponse.json(formatPost(post), { status: 201 });
    } catch (error) {
        console.error("Error creating post:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}