import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import Post from "@/lib/models/Post";
import Report from "@/lib/models/Report";
import { getValidReportReason } from "@/lib/posts/moderation";

export async function POST(request, { params }) {
  try {
    const { postId } = await params;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = getValidReportReason(body?.reason);
    const details = String(body?.details ?? "").trim().slice(0, 500);

    if (!reason) {
      return NextResponse.json({ error: "Select a valid report reason" }, { status: 400 });
    }

    await connectDB();

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const token = await getToken({ req: request });
    const reporterId = token?.id && mongoose.Types.ObjectId.isValid(token.id) ? token.id : null;

    await Report.create({
      post: post._id,
      reporter: reporterId,
      reason,
      details,
    });

    post.reportCount = (post.reportCount ?? 0) + 1;
    if (post.reportCount >= 3) {
      post.moderationStatus = "under_review";
    }
    await post.save();

    return NextResponse.json(
      {
        message: "Report received. Thank you — this event is now queued for review.",
        reportCount: post.reportCount,
        moderationStatus: post.moderationStatus,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)[0]?.message ?? "Invalid report";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Error reporting post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
