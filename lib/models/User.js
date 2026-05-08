import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minLength: [6, "Username must be at least 6 characters"],
      maxLength: [20, "Username cannot exceed 20 characters"],
      match: [/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, periods, hyphens, and underscores"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
