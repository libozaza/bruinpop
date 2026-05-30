import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(request, { params }) {
  const { username } = await params;

  try {
    await connectDB();

    const user = await User.findOne({ username }).select(
      "username bio profilePicture hypeScore createdAt"
      // password excluded
    );

    if(!user){
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } 
  catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}