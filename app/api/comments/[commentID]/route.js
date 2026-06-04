import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/lib/models/Comment";
import Post from "@/lib/models/Post";
import User from "@/lib/models/User";
import mongoose from "mongoose";
import { applyHostHypeIfNotSelf } from "@/lib/hype/service.js";
import { triggerInteractionUpdated } from "@/lib/pusher/pusher-server.js";

export async function PATCH(request, { params }) {
  try {
    const { commentID } = await params;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (content.trim().length > 200) {
      return NextResponse.json({ error: "Comment cannot exceed 200 characters" }, { status: 400 });
    }

    const token = await getToken({ req: request });
    if (!token?.id) {
      return NextResponse.json({ error: "Must be logged in to edit a comment" }, { status: 401 });
    }

    await connectDB();

    const comment = await Comment.findById(commentID);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (String(comment.user) !== String(token.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    comment.content = content.trim();
    await comment.save();

    await triggerInteractionUpdated(String(comment.post));

    return NextResponse.json({
      id: String(comment._id),
      content: comment.content,
      updatedAt: comment.updatedAt,
    }, { status: 200 });
  } catch (err) {
    console.error("Error editing comment:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { commentID } = await params;

    const token = await getToken({ req: request });
    if (!token?.id) {
      return NextResponse.json({ error: "Must be logged in to delete a comment" }, { status: 401 });
    }

    await connectDB();

    const comment = await Comment.findById(commentID);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (String(comment.user) !== String(token.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const post = await Post.findById(comment.post).select("creator");
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await Comment.findByIdAndDelete(commentID).session(session);
        await Post.findByIdAndUpdate(comment.post, { $inc: { comments: -1 } }).session(session);
      });

      await applyHostHypeIfNotSelf({
        hostId: post.creator,
        actorUserId: token.id,
        kinds: ["uncomment"],
      });

      await triggerInteractionUpdated(String(comment.post));
    } finally {
      await session.endSession();
    }

    return NextResponse.json({ message: "Comment deleted" }, { status: 200 });
  } catch (err) {
    console.error("Error deleting comment:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}