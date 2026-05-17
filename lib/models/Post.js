import mongoose from "mongoose";
import { POST_CATEGORY_IDS } from "@/lib/posts/categories";

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minLength: [5, "Title must be at least 5 characters"],
      maxLength: [100, "Title cannot exceed 100 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      maxLength: [1000, "Content cannot exceed 1000 characters"],
    },
    categories: {
      type: [
        {
          type: String,
          enum: POST_CATEGORY_IDS,
        },
      ],
      default: [],
      index: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    // Optional map schema for when map is implemented
    location: {
      label: { type: String, trim: true, maxLength: 160, default: "" },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    moderationStatus: {
      type: String,
      enum: ["approved", "under_review", "hidden"],
      default: "approved",
      index: true,
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

PostSchema.index({ categories: 1, moderationStatus: 1, createdAt: -1 });
PostSchema.index({ "location.lat": 1, "location.lng": 1 });

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
