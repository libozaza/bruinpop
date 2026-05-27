import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Post from "@/lib/models/Post";
import { formatPost } from "@/lib/posts/format.js";

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