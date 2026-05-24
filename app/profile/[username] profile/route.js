import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";   // adjust path if your db helper is named differently
import User from "@/lib/models/User";

export async function GET(request, { params }) {
  const { username } = await params;

  try {
    await dbConnect();

    const user = await User.findOne({ username }).select(
      "username bio profilePicture hype createdAt"
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