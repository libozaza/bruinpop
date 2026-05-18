import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import Post from "@/lib/models/Post";
import { getValidCategoryIds, parseCategoryQuery } from "@/lib/posts/categories";
import { scanPostContent, validatePostPayload } from "@/lib/posts/moderation";
import "@/lib/models/User";

function formatPost(post) {
  const categories = Array.isArray(post.categories) ? post.categories : [];

  return {
    id: String(post._id),
    title: post.title,
    content: post.content,
    categories,
    categoryLabels: categories
      .map((categoryId) => getValidCategoryIds(categoryId)?.label)
      .filter(Boolean),
    creatorUsername: post.creator?.username ?? "unknown",
    createdAt: post.createdAt,
    location: post.location ?? null,
    reportCount: post.reportCount ?? 0,
    moderationStatus: post.moderationStatus ?? "approved",
  };
}

function buildPostQuery(searchParams) {
  const categories = parseCategoryQuery(searchParams.get("categories"));
  const hideReported = searchParams.get("hideReported") === "true";

  const query = {
    $or: [
      { moderationStatus: "approved" },
      { moderationStatus: { $exists: false } },
    ],
  };

  if (categories.length > 0) {
    query.categories = { $in: categories };
  }

  if (hideReported) {
    query.reportCount = { $in: [0, null] };
  }

  return query;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
     // sort posts by creation date in descending order and populate creator's username
    await connectDB();
    const posts = await Post.find(buildPostQuery(searchParams))
      .sort({ createdAt: -1 })
      .populate("creator", "username");

    return NextResponse.json(posts.map(formatPost), { status: 200 });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const validation = validatePostPayload(body);

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const moderation = scanPostContent(validation.value);
    if (!moderation.allowed) {
      return NextResponse.json({ error: moderation.reason }, { status: 400 });
    }

    await connectDB();
    const token = await getToken({ req: request });
    const creatorId = token?.id;

    if (!creatorId) {
      return NextResponse.json(
        { error: "Must be logged in to create a post" },
        { status: 401 },
      );
    }

    const post = new Post({
      ...validation.value,
      creator: creatorId,
      moderationStatus: "approved",
    });

    await post.save();
    await post.populate("creator", "username");

    return NextResponse.json(formatPost(post), { status: 201 });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)[0]?.message ?? "Invalid post";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
