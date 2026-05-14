import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            minLength: [5, 'Title must be at least 5 characters'],
            maxLength: [100, 'Title cannot exceed 100 characters'],
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
            trim: true,
            maxLength: [1000, 'Content cannot exceed 1000 characters'],
        },
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            // TODO: make this required once we have authentication in place and can reliably attach creatorId on the server side; for now we allow it to be optional to simplify testing and development
            required: [false, 'Creator is not required'],
        },
    },
    { timestamps: true }
);

export default mongoose.models.Post || mongoose.model('Post', PostSchema);