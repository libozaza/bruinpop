import mongoose from 'mongoose';

const VoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  value: { type: Number, enum: [1, -1], required: true },
}, { timestamps: true });

VoteSchema.index({ user: 1, post: 1 }, { unique: true });
export default mongoose.models.Vote || mongoose.model('Vote', VoteSchema);