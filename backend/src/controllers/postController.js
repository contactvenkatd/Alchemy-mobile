import { z } from 'zod';
import mongoose from 'mongoose';
import { Post } from '../models/Post.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createPostSchema = z.object({
  text: z.string().trim().max(1000).optional(),
  images: z.array(z.string()).max(4).optional(),
  taggedProducts: z.array(z.string()).max(5).optional(),
});

export const commentSchema = z.object({
  text: z.string().trim().min(1).max(500),
});

/** GET /api/posts — the social feed, newest first */
export const listPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(30, Number(req.query.limit) || 10);

  const [posts, total] = await Promise.all([
    Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'name city avatarUrl')
      .populate('taggedProducts', 'title titleHi price mrp images cashbackPercent')
      .populate('comments.author', 'name avatarUrl'),
    Post.countDocuments(),
  ]);

  const viewerId = req.user ? String(req.user._id) : null;
  const items = posts.map((p) => ({
    ...p.toObject(),
    likeCount: p.likes.length,
    commentCount: p.comments.length,
    likedByMe: viewerId ? p.likes.some((id) => String(id) === viewerId) : false,
  }));

  res.json({ items, page, limit, total, hasMore: page * limit < total });
});

/**
 * GET /api/posts/:id — one post with its comments, for the post detail screen.
 * Auth is optional so `likedByMe` is only set when a token is sent.
 */
export const getPost = asyncHandler(async (req, res) => {
  // Guard first: findById on a malformed id throws a CastError, which the
  // error middleware would surface as a 500 with Mongoose internals in it.
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const post = await Post.findById(req.params.id)
    .populate('author', 'name city avatarUrl')
    .populate('taggedProducts', 'title titleHi price mrp images cashbackPercent')
    .populate('comments.author', 'name avatarUrl');
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const viewerId = req.user ? String(req.user._id) : null;
  return res.json({
    post: {
      ...post.toObject(),
      likeCount: post.likes.length,
      commentCount: post.comments.length,
      likedByMe: viewerId ? post.likes.some((id) => String(id) === viewerId) : false,
    },
  });
});

/** POST /api/posts */
export const createPost = asyncHandler(async (req, res) => {
  const post = await Post.create({ ...req.body, author: req.user._id });
  await post.populate([
    { path: 'author', select: 'name city avatarUrl' },
    { path: 'taggedProducts', select: 'title titleHi price mrp images cashbackPercent' },
  ]);
  res.status(201).json({ post });
});

/** POST /api/posts/:id/like — toggles */
export const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const userId = String(req.user._id);
  const idx = post.likes.findIndex((id) => String(id) === userId);
  if (idx >= 0) post.likes.splice(idx, 1);
  else post.likes.push(req.user._id);
  await post.save();

  return res.json({ liked: idx < 0, likeCount: post.likes.length });
});

/** POST /api/posts/:id/comment */
export const addComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  post.comments.push({ author: req.user._id, text: req.body.text });
  await post.save();
  await post.populate('comments.author', 'name avatarUrl');

  return res.status(201).json({ comment: post.comments.at(-1), commentCount: post.comments.length });
});

/** POST /api/posts/:id/share */
export const sharePost = asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { shareCount: 1 } },
    { new: true },
  );
  if (!post) return res.status(404).json({ error: 'Post not found' });

  return res.json({
    shareCount: post.shareCount,
    shareUrl: `https://alchemy.app/p/${post._id}?ref=${req.user.referralCode}`,
  });
});
