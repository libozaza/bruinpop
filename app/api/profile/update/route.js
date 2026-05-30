import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function PATCH(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { bio, profilePicture } = await request.json();

  if (bio && bio.length > 300) {
    return NextResponse.json({ error: "Bio exceeds 300 characters" }, { status: 400 });
  }

  try {
    await connectDB();

    const updated = await User.findOneAndUpdate(
      { username: session.user.name },
      { bio: bio ?? "", profilePicture: profilePicture ?? "" },
      { new: true, select: "username bio profilePicture hype" },
    );

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
