import mongoose from "mongoose";
import { REPORT_REASON_CATEGORY_IDS } from "@/lib/posts/moderation";

// Report schema for user reports on posts, linked to Post and User models
const ReportSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Post is required"],
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    reason: {
      type: String,
      required: [true, "Report reason is required"],
      enum: REPORT_REASON_CATEGORY_IDS,
    },
    details: {
      type: String,
      trim: true,
      maxLength: [500, "Report details cannot exceed 500 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true },
);

ReportSchema.index({ post: 1, createdAt: -1 });

export default mongoose.models.Report || mongoose.model("Report", ReportSchema);