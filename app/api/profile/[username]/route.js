import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(request, { params }) {
  const { username } = await params;

  try {
    await connectDB();

    const user = await User.findOne({ username }).select(
      "username bio profilePicture hypeScore createdAt followers following"
      // password excluded
    );

    if(!user){
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      user: {
        _id: user._id.toString(),
        username: user.username,
        bio: user.bio,
        profilePicture: user.profilePicture,
        hypeScore: user.hypeScore,
        createdAt: user.createdAt?.toISOString() ?? null,
        updatedAt: user.updatedAt?.toISOString() ?? null,
        followerCount: user.followers.length,
        followingCount: user.following.length,
        followerIds: user.followers.map((id) => id.toString()),
      },
    });
  } 
  catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}