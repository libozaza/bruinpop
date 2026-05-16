import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import Post from "@/lib/models/Post";
import { getCategoryById } from "@/lib/posts/categories";
import { scanPostContent, validatePostPayload } from "@/lib/posts/moderation";

function formatPost(post) {
  const categories = Array.isArray(post.categories) ? post.categories : [];

  return {
    id: String(post._id),
    title: post.title,
    content: post.content,
    categories,
    categoryLabels: categories
      .map((categoryId) => getCategoryById(categoryId)?.label)
      .filter(Boolean),
    creatorUsername: post.creator?.username ?? "unknown",
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    location: post.location ?? null,
    reportCount: post.reportCount ?? 0,
    moderationStatus: post.moderationStatus ?? "approved",
  };
}

export async function PATCH(request, { params }) {
  try {
    const { postId } = await params;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
    }

    const body = await request.json();
    const validation = validatePostPayload(body);

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const moderation = scanPostContent(validation.value);
    if (!moderation.allowed) {
      return NextResponse.json(
        {
          error: moderation.reason,
          preservedLastApprovedVersion: true,
        },
        { status: 400 },
      );
    }

    await connectDB();
    const token = await getToken({ req: request });
    const userId = token?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Must be logged in to edit a post" },
        { status: 401 },
      );
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (String(post.creator) !== String(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    post.title = validation.value.title;
    post.content = validation.value.content;
    post.categories = validation.value.categories;
    post.moderationStatus = "approved";

    await post.save();
    await post.populate("creator", "username");

    return NextResponse.json(formatPost(post), { status: 200 });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)[0]?.message ?? "Invalid post";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
