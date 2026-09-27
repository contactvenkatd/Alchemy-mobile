import { z } from 'zod';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { Pool } from '../models/Pool.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { splitAmount } from '../utils/money.js';
import { SPLIT } from '../config/env.js';

export const purchaseSchema = z.object({
  productId: z.string().refine(mongoose.isValidObjectId, 'Invalid product id'),
  quantity: z.number().int().positive().max(20).default(1),
  paymentMethod: z.enum(['wallet', 'cod']).default('wallet'),
});

export const topupSchema = z.object({
  amount: z.number().int().positive().max(10_000_00), // paise, ₹10,000 cap
});

/**
 * POST /api/transactions/purchase
 *
 * Money flow for one purchase of `total` paise:
 *   90%  -> seller wallet        (minus seller-funded cashback to the buyer)
 *    5%  -> the buyer's referrer (falls back to the pool if there is none)
 *    5%  -> community investment pool, which also mints pool units for the buyer
 *
 * A standalone mongod has no multi-document transactions, so we only open a
 * session when the deployment supports one (replica set / Atlas).
 */
export const purchase = asyncHandler(async (req, res) => {
  const { productId, quantity, paymentMethod } = req.body;
  const buyer = req.user;

  const product = await Product.findById(productId);
  if (!product || !product.active) return res.status(404).json({ error: 'Product not available' });
  if (product.stock < quantity) return res.status(400).json({ error: 'Not enough stock' });
  if (String(product.seller) === String(buyer._id)) {
    return res.status(400).json({ error: 'You cannot buy your own product' });
  }

  const total = product.price * quantity;
  if (paymentMethod === 'wallet' && buyer.walletBalance < total) {
    return res.status(400).json({ error: 'Insufficient wallet balance', required: total, available: buyer.walletBalance });
  }

  const parts = splitAmount(total, SPLIT);
  const cashback = Math.floor((total * (product.cashbackPercent || 0)) / 100);
  const sellerNet = parts.seller - cashback; // cashback is funded by the seller's share
  const referrerId = buyer.referredBy;
  const referrerCut = referrerId ? parts.referrer : 0;
  const poolCut = parts.pool + (referrerId ? 0 : parts.referrer); // unreferred sales fund the pool

  const session = await startSessionIfSupported();
  const opts = session ? { session } : {};

  try {
    if (session) session.startTransaction();

    // Parent ledger row.
    const [order] = await Transaction.create(
      [{
        type: 'purchase',
        amount: total,
        user: buyer._id,
        direction: 'debit',
        product: product._id,
        quantity,
        note: `${quantity} x ${product.title} (${paymentMethod})`,
      }],
      opts,
    );

    const legs = [
      { type: 'seller_payout', amount: sellerNet, user: product.seller, direction: 'credit' },
      { type: 'pool_contribution', amount: poolCut, user: buyer._id, direction: 'credit', note: 'Community pool share' },
    ];
    if (cashback > 0) legs.push({ type: 'cashback', amount: cashback, user: buyer._id, direction: 'credit' });
    if (referrerCut > 0) legs.push({ type: 'referral_bonus', amount: referrerCut, user: referrerId, direction: 'credit' });

    await Transaction.create(
      legs.map((l) => ({ ...l, parent: order._id, product: product._id, quantity })),
      opts,
    );

    // Balances.
    if (paymentMethod === 'wallet') {
      await User.updateOne({ _id: buyer._id }, { $inc: { walletBalance: -total } }, opts);
    }
    await User.updateOne(
      { _id: product.seller },
      { $inc: { walletBalance: sellerNet, lifetimeEarnings: sellerNet } },
      opts,
    );
    await User.updateOne(
      { _id: buyer._id },
      { $inc: { walletBalance: cashback, lifetimeEarnings: cashback, poolUnits: poolCut } },
      opts,
    );
    if (referrerCut > 0) {
      await User.updateOne(
        { _id: referrerId },
        { $inc: { walletBalance: referrerCut, lifetimeEarnings: referrerCut } },
        opts,
      );
    }

    await Product.updateOne({ _id: product._id }, { $inc: { stock: -quantity } }, opts);
    await Pool.updateOne(
      { key: 'main' },
      { $inc: { balance: poolCut, totalContributed: poolCut, totalUnits: poolCut } },
      { ...opts, upsert: true },
    );

    if (session) await session.commitTransaction();

    const fresh = await User.findById(buyer._id);
    return res.status(201).json({
      order: { id: order._id, total, quantity },
      split: { seller: sellerNet, referrer: referrerCut, pool: poolCut, cashback },
      walletBalance: fresh.walletBalance,
      poolUnits: fresh.poolUnits,
    });
  } catch (err) {
    if (session) await session.abortTransaction();
    throw err;
  } finally {
    if (session) await session.endSession();
  }
});

/** GET /api/transactions — the signed-in user's ledger */
export const listTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = { user: req.user._id };
  if (req.query.type) filter.type = req.query.type;

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('product', 'title titleHi images'),
    Transaction.countDocuments(filter),
  ]);

  res.json({ items, page, limit, total, hasMore: page * limit < total });
});

/** GET /api/transactions/wallet — balance + a few headline numbers */
export const getWallet = asyncHandler(async (req, res) => {
  const rows = await Transaction.aggregate([
    { $match: { user: req.user._id, status: 'completed' } },
    { $group: { _id: { type: '$type', direction: '$direction' }, total: { $sum: '$amount' } } },
  ]);

  const sum = (type) => rows.filter((r) => r._id.type === type).reduce((a, r) => a + r.total, 0);

  res.json({
    balance: req.user.walletBalance,
    lifetimeEarnings: req.user.lifetimeEarnings,
    totalSpent: sum('purchase'),
    cashback: sum('cashback'),
    referralBonus: sum('referral_bonus'),
    poolContributed: sum('pool_contribution'),
  });
});

/** POST /api/transactions/topup — stand-in for a payment gateway callback */
export const topup = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  await Transaction.create({
    type: 'topup',
    amount,
    user: req.user._id,
    direction: 'credit',
    note: 'Wallet top-up',
  });
  req.user.walletBalance += amount;
  await req.user.save();

  res.status(201).json({ balance: req.user.walletBalance });
});

async function startSessionIfSupported() {
  try {
    const session = await mongoose.startSession();
    // Standalone servers accept startSession but reject startTransaction.
    const isReplicaSet = Boolean(mongoose.connection.db?.s?.topology?.s?.description?.type?.includes('ReplicaSet'));
    if (!isReplicaSet) {
      await session.endSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}
