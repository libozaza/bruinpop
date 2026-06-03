import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  content: { type: String, required: true, maxlength: 200 },
}, { timestamps: true });

CommentSchema.index({ user: 1, post: 1 }, { unique: false });
export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema);