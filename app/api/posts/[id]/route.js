import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import Post from "@/lib/models/Post";
import Comment from "@/lib/models/Comment";
import Vote from "@/lib/models/Vote";
import User from "@/lib/models/User"; // Only used for the Post GET route's population of creator username and hypeScore
import { formatPost } from "@/lib/posts/format.js";
import { triggerInteractionUpdated, triggerPostDeleted } from "@/lib/pusher/pusher-server.js";

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        await connectDB();
        const post = await Post.findById(id).populate("creator", "username hypeScore");

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const token = await getToken({ req: request });
        const comments = await Comment.find({ post: id })
            .sort({ createdAt: 1 })
            .populate("user", "username");
        const formattedPost = await formatPost(post, token, comments);

        return NextResponse.json(formattedPost, { status: 200 });
    } catch (error) {
        console.error("Error fetching post:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const { action, content } = await request.json();
        const trimmedContent = action === "comment" ? content?.trim() : null;

        if (!action) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        if (action === "comment" && !trimmedContent) {
            return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
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

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const existingVote = await Vote.findOne({ user: userId, post: id }).session(session);

                if (action === "upvote") {
                    if (existingVote && existingVote.value === 1) {
                        await Vote.findOneAndDelete({ user: userId, post: id }).session(session);
                        await Post.findByIdAndUpdate(id, { $inc: { votes: -1 } }).session(session);
                    } else if (existingVote && existingVote.value === -1) {
                        await Vote.findOneAndUpdate({ user: userId, post: id }, { value: 1 }).session(session);
                        await Post.findByIdAndUpdate(id, { $inc: { votes: 2 } }).session(session);
                    } else {
                        await Vote.create([{ user: userId, post: id, value: 1 }], { session });
                        await Post.findByIdAndUpdate(id, { $inc: { votes: 1 } }).session(session);
                    }
                } else if (action === "downvote") {
                    if (existingVote && existingVote.value === -1) {
                        await Vote.findOneAndDelete({ user: userId, post: id }).session(session);
                        await Post.findByIdAndUpdate(id, { $inc: { votes: 1 } }).session(session);
                    } else if (existingVote && existingVote.value === 1) {
                        await Vote.findOneAndUpdate({ user: userId, post: id }, { value: -1 }).session(session);
                        await Post.findByIdAndUpdate(id, { $inc: { votes: -2 } }).session(session);
                    } else {
                        await Vote.create([{ user: userId, post: id, value: -1 }], { session });
                        await Post.findByIdAndUpdate(id, { $inc: { votes: -1 } }).session(session);
                    }
                } else if (action === "share") {
                    await Post.findByIdAndUpdate(id, { $inc: { shares: 1 } }).session(session);
                } else if (action === "comment") {
                    await Post.findByIdAndUpdate(id, { $inc: { comments: 1 } }).session(session);
                    await Comment.create([{ user: userId, post: id, content: trimmedContent }], { session });
                }
                else {
                    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
                }
            }, {
                readPreference: "primary",
                readConcern: { level: "local" },
                writeConcern: { w: "majority" },
            });

            // notify clients after successful commit
            await triggerInteractionUpdated(id);
        } catch (error) {
            console.error("Transaction error updating vote:", error);
            return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        } finally {
            session.endSession();
        }

            const refreshedPost = await Post.findById(id).populate("creator", "username hypeScore");
            const comments = await Comment.find({ post: id })
                .sort({ createdAt: 1 })
                .populate("user", "username");
            const formattedPost = await formatPost(refreshedPost, token, comments);

        return NextResponse.json(formattedPost, { status: 200 });
    } catch (error) {
        console.error("Error updating post:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        await connectDB();
        const post = await Post.findById(id);
        
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const token = await getToken({ req: request });
        const userId = token?.id;
        if (!userId) {
            return NextResponse.json({ error: "Must be logged in to delete post" }, { status: 401 });
        }
        
        if (post.creator.toString() !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await Post.findByIdAndDelete(id);
        await Vote.deleteMany({ post: id });
        await Comment.deleteMany({ post: id });
        await triggerPostDeleted(id);
        return NextResponse.json({ message: "Post deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting post:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}