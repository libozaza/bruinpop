import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import Post from "@/lib/models/Post";
import Comment from "@/lib/models/Comment";
import Vote from "@/lib/models/Vote";
import RSVP from "@/lib/models/RSVP";
import User from "@/lib/models/User"; // Only used for the Post GET route's population of creator username and hypeScore
import { formatPost } from "@/lib/posts/format.js";
import { getHypeKindsForInteraction } from "@/lib/hype/interaction-deltas.js";
import { recordHostEngagements } from "@/lib/hype/service.js";
import { triggerInteractionUpdated, triggerPostDeleted, triggerPostUpdated } from "@/lib/pusher/pusher-server.js";

const POST_ACTIONS = new Set([
    "upvote",
    "downvote",
    "share",
    "comment",
    "rsvp",
    "unrsvp",
]);

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
        const rsvps = await RSVP.find({ post: id })
            .sort({ createdAt: 1 })
            .populate("user", "username");
        const formattedPost = await formatPost(post, token, comments, {
            rsvps,
            rsvpCount: rsvps.length,
        });

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

        if (!POST_ACTIONS.has(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
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

        const existingVote = await Vote.findOne({ user: userId, post: id });
        const existingRsvp =
            action === "rsvp" || action === "unrsvp"
                ? await RSVP.findOne({ user: userId, post: id })
                : null;
        const hypeKinds = getHypeKindsForInteraction(action, {
            existingVote,
            existingRsvp,
        });

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
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
                } else if (action === "rsvp") {
                    if (!existingRsvp) {
                        await RSVP.create([{ user: userId, post: id }], { session });
                        await Post.findByIdAndUpdate(id, { $inc: { RSVPs: 1 } }).session(session);
                    }
                } else if (action === "unrsvp") {
                    if (existingRsvp) {
                        await RSVP.findOneAndDelete({ user: userId, post: id }).session(session);
                        await Post.findByIdAndUpdate(id, { $inc: { RSVPs: -1 } }).session(session);
                    }
                }
            }, {
                readPreference: "primary",
                readConcern: { level: "local" },
                writeConcern: { w: "majority" },
            });

            const hostId = post.creator;
            if (
                hypeKinds.length > 0 &&
                hostId &&
                String(hostId) !== String(userId)
            ) {
                await recordHostEngagements({ hostId, kinds: hypeKinds });
            }

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
            const rsvps = await RSVP.find({ post: id })
                .sort({ createdAt: 1 })
                .populate("user", "username");
            const formattedPost = await formatPost(refreshedPost, token, comments, {
                rsvps,
                rsvpCount: rsvps.length,
            });

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

export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const { title, content } = await request.json();

        if (!title || !content) {
            return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
        }

        if (title.length < 5 || title.length > 100) {
            return NextResponse.json({ error: "Title must be between 5 and 100 characters" }, { status: 400 });
        }

        if (content.length > 1000) {
            return NextResponse.json({ error: "Content cannot exceed 1000 characters" }, { status: 400 });
        }

        await connectDB();
        const post = await Post.findById(id);

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const token = await getToken({ req: request });
        const userId = token?.id;
        if (!userId) {
            return NextResponse.json({ error: "Must be logged in to edit post" }, { status: 401 });
        }

        if (post.creator.toString() !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const updatedPost = await Post.findById(
            id, 
            { title: title.trim(), content: content.trim() },
            { new: true, runValidators: false }
        ).populate("creator", "username hypeScore");

        const comments = await Comment.find({ post: id })
            .sort({ createdAt: 1 })
            .populate("user", "username");
        const rsvps = await RSVP.find({ post: id })
            .sort({ createdAt: 1 })
            .populate("user", "username");
        const formattedPost = await formatPost(updatedPost, token, comments, {
            rsvps,
            rsvpCount: rsvps.length,
        });
        await triggerPostUpdated(formattedPost);

        return NextResponse.json(formattedPost, { status: 200 });
    } catch (error) {
        console.error("Error editing post:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}