import { z } from 'zod';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createProductSchema = z.object({
  title: z.string().trim().min(2).max(120),
  titleHi: z.string().trim().max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  descriptionHi: z.string().trim().max(2000).optional(),
  price: z.number().int().positive(),
  mrp: z.number().int().nonnegative().optional(),
  category: z.enum(['grocery', 'fashion', 'electronics', 'home', 'beauty', 'farm', 'other']),
  images: z.array(z.string()).max(6).optional(),
  stock: z.number().int().nonnegative().default(0),
  city: z.string().trim().max(60).optional(),
  cashbackPercent: z.number().min(0).max(20).optional(),
});

/**
 * GET /api/products
 * Filters: q, category, minPrice, maxPrice, city, sort, page, limit
 */
export const listProducts = asyncHandler(async (req, res) => {
  const { q, category, minPrice, maxPrice, city, sort = 'new' } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const filter = { active: true };
  if (category) filter.category = category;
  if (city) filter.city = city;
  if (q) filter.title = { $regex: String(q).trim(), $options: 'i' };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    new: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1 },
  };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sortMap[sort] || sortMap.new)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('seller', 'name city avatarUrl'),
    Product.countDocuments(filter),
  ]);

  res.json({ items, page, limit, total, hasMore: page * limit < total });
});

/** GET /api/products/:id */
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('seller', 'name city avatarUrl');
  if (!product) return res.status(404).json({ error: 'Product not found' });
  return res.json({ product });
});

/** POST /api/products */
export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, seller: req.user._id });
  res.status(201).json({ product });
});

/** PATCH /api/products/:id — seller only */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (String(product.seller) !== String(req.user._id)) {
    return res.status(403).json({ error: 'Not your product' });
  }
  Object.assign(product, req.body);
  await product.save();
  return res.json({ product });
});

/** GET /api/products/meta/categories */
export const listCategories = asyncHandler(async (_req, res) => {
  const rows = await Product.aggregate([
    { $match: { active: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ categories: rows.map((r) => ({ key: r._id, count: r.count })) });
});
