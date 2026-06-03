import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { connectDB } from "@/lib/mongodb";
import Post from "@/lib/models/Post";
import "@/lib/models/User";

import { triggerPostCreated } from "@/lib/pusher/pusher-server";
import { formatPost } from "@/lib/posts/format.js";
import { cleanCategoryIds, parseCategoryQuery } from "@/lib/posts/categories";
import { getCampusLocationById } from "@/lib/maps/campus-locations.js";
import { hasValidCoordinates } from "@/lib/maps/geo.js";

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

function resolvePostLocation({ campusLocationId, location }) {
  if (campusLocationId) {
    const preset = getCampusLocationById(campusLocationId);
    if (!preset) {
      return { error: "Invalid campus map location" };
    }
    return {
      value: {
        label: preset.label,
        lat: preset.latitude,
        lng: preset.longitude,
      },
    };
  }

  if (location == null) {
    return { value: undefined };
  }

  const lat = location?.lat;
  const lng = location?.lng;
  const hasLat = lat != null && lat !== "";
  const hasLng = lng != null && lng !== "";

  if (!hasLat && !hasLng) {
    return { value: undefined };
  }

  if (!hasLat || !hasLng) {
    return { error: "Map location requires both lat and lng" };
  }

  if (!hasValidCoordinates(Number(lat), Number(lng))) {
    return { error: "Invalid map coordinates" };
  }

  const label = String(location?.label ?? "").trim().slice(0, 160);

  return {
    value: {
      label,
      lat: Number(lat),
      lng: Number(lng),
    },
  };
}

export async function POST(request) {
  try {
    const {
      title,
      content,
      categories = [],
      date,
      address,
      campusLocationId,
      location,
    } = await request.json();

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

    const resolvedLocation = resolvePostLocation({ campusLocationId, location });
    if (resolvedLocation.error) {
      return NextResponse.json({ error: resolvedLocation.error }, { status: 400 });
    }

    const postPayload = {
      title,
      content,
      categories: cleanCategoryIds(categories),
      creator: creatorId,
      moderationStatus: "approved",
      date: dateObj,
      address: trimmedAddress,
    };

    if (resolvedLocation.value) {
      postPayload.location = resolvedLocation.value;
    }

    const post = new Post(postPayload);

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