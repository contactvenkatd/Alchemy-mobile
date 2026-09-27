import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true },
);

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, default: '', maxlength: 1000 },
    images: { type: [String], default: [] },
    // Products tagged in the post — this is what makes the feed shoppable.
    taggedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: { type: [commentSchema], default: [] },
    shareCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Post = mongoose.model('Post', postSchema);
