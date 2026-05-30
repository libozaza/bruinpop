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
    bio: {
      type: String,
      default: "",
      trim: true,
      maxLength: [300, "Bio cannot exceed 300 characters"],
    },
    profilePicture: {
      type: String,
      default: "",
      trim: true,
    },
    hypeScore: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
