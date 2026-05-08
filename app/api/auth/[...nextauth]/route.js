import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
 
export async function POST(request) {
  try {
    const { username, password } = await request.json();
 
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }
 
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
 
    await connectDB();
 
    const existing = await User.findOne({ username });
    if (existing) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }
 
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, passwordHash });
 
    return NextResponse.json(
      { message: "Account created", username: user.username },
      { status: 201 }
    );
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)[0].message;
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}