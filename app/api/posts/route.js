import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { connectDB } from "@/lib/mongodb";
import Post from "@/lib/models/Post";
import "@/lib/models/User";

import { triggerPostCreated } from "@/lib/pusher/pusher-server";
import { formatPost } from "@/lib/posts/format.js";
import { cleanCategoryIds, parseCategoryQuery } from "@/lib/posts/categories";

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
    query.categories = { $all: categories };
  }

  if (hideReported) {
    query.reportCount = { $in: [0, null] };
  }

  return query;
}

export async function GET(request) {
  // TODO: change to cap how many posts you get
  try {
    const { searchParams } = new URL(request.url);

    await connectDB();

    // Sort posts by creation date in descending order and populate creator's username and hypeScore
    const posts = await Post.find(buildPostQuery(searchParams))
      .sort({ createdAt: -1 })
      .populate("creator", "username hypeScore");

    const token = await getToken({ req: request });
    const formattedPosts = await Promise.all(
      posts.map((post) => formatPost(post, token)),
    );

    return NextResponse.json(formattedPosts, { status: 200 });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, content, categories = [], date, address } = await request.json();

    if (!title || !content || !date || !address) {
      return NextResponse.json({ error: "Title, content, date, and address are required" }, { status: 400 });
    }

    const dateObj = new Date(date);
    if (Number.isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
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

    const trimmedAddress = String(address).trim();
    if (!trimmedAddress) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    if (trimmedAddress.length > 200) {
      return NextResponse.json({ error: "Address cannot exceed 200 characters" }, { status: 400 });
    }

    const post = new Post({
      title,
      content,
      categories: cleanCategoryIds(categories),
      creator: creatorId,
      moderationStatus: "approved",
      date: dateObj,
      address: trimmedAddress,
    });

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
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)[0]?.message ?? "Invalid post";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}