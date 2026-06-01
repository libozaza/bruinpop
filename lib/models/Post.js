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
            required: [true, 'Creator is required'],
        },
        votes: {
            type: Number,
            default: 0,
        },
        shares: {
            type: Number,
            default: 0,
        },
        comments: {
            type: Number,
            default: 0,
        },
        // Optional map pin — posts team can set when creating/updating events.
        latitude: {
            type: Number,
            min: -90,
            max: 90,
        },
        longitude: {
            type: Number,
            min: -180,
            max: 180,
        },
        locationLabel: {
            type: String,
            trim: true,
            maxLength: 120,
        },
    },
    { timestamps: true }
);

export default mongoose.models.Post || mongoose.model('Post', PostSchema);