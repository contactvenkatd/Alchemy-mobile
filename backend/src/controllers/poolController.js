import { z } from 'zod';
import { Pool } from '../models/Pool.js';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const fundBusinessSchema = z.object({
  name: z.string().trim().min(2).max(120),
  nameHi: z.string().trim().max(120).optional(),
  city: z.string().trim().max(60).optional(),
  category: z.string().trim().max(40).optional(),
  amountFunded: z.number().int().positive(),
  monthlyReturnPercent: z.number().min(0).max(100).optional(),
});

/** GET /api/pool — public snapshot of the community fund */
export const getPool = asyncHandler(async (req, res) => {
  const pool = await Pool.getMain();
  const active = pool.businesses.filter((b) => b.status === 'active');
  const invested = active.reduce((a, b) => a + b.amountFunded, 0);

  const mine = req.user
    ? {
        units: req.user.poolUnits,
        sharePercent: pool.totalUnits > 0 ? Number(((req.user.poolUnits / pool.totalUnits) * 100).toFixed(4)) : 0,
        valuePaise: pool.totalUnits > 0
          ? Math.round(((pool.balance + invested) * req.user.poolUnits) / pool.totalUnits)
          : 0,
      }
    : null;

  res.json({
    balance: pool.balance,
    invested,
    totalContributed: pool.totalContributed,
    totalReturns: pool.totalReturns,
    totalUnits: pool.totalUnits,
    activeBusinessCount: active.length,
    businesses: pool.businesses,
    me: mine,
  });
});

/** GET /api/pool/me — the signed-in user's share */
export const myShare = asyncHandler(async (req, res) => {
  const pool = await Pool.getMain();
  const invested = pool.businesses
    .filter((b) => b.status === 'active')
    .reduce((a, b) => a + b.amountFunded, 0);

  const sharePercent = pool.totalUnits > 0 ? (req.user.poolUnits / pool.totalUnits) * 100 : 0;
  const payouts = await Transaction.aggregate([
    { $match: { user: req.user._id, type: 'pool_payout' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  res.json({
    units: req.user.poolUnits,
    sharePercent: Number(sharePercent.toFixed(4)),
    valuePaise: Math.round(((pool.balance + invested) * sharePercent) / 100),
    payoutsReceived: payouts[0]?.total || 0,
  });
});

/** POST /api/pool/businesses — fund a local business out of the pool (admin-ish) */
export const fundBusiness = asyncHandler(async (req, res) => {
  const pool = await Pool.getMain();
  if (pool.balance < req.body.amountFunded) {
    return res.status(400).json({ error: 'Pool balance too low', balance: pool.balance });
  }

  pool.businesses.push(req.body);
  pool.balance -= req.body.amountFunded;
  await pool.save();

  return res.status(201).json({ business: pool.businesses.at(-1), balance: pool.balance });
});

/**
 * POST /api/pool/businesses/:id/return
 * Books a return and distributes it to holders pro-rata by pool units.
 */
export const recordReturn = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive integer (paise)' });
  }

  const pool = await Pool.getMain();
  const business = pool.businesses.id(req.params.id);
  if (!business) return res.status(404).json({ error: 'Business not found' });
  if (pool.totalUnits <= 0) return res.status(400).json({ error: 'Pool has no unit holders yet' });

  const holders = await User.find({ poolUnits: { $gt: 0 } }).select('_id poolUnits');
  let distributed = 0;

  for (const holder of holders) {
    const cut = Math.floor((amount * holder.poolUnits) / pool.totalUnits);
    if (cut <= 0) continue;
    distributed += cut;
    await User.updateOne({ _id: holder._id }, { $inc: { walletBalance: cut, lifetimeEarnings: cut } });
    await Transaction.create({
      type: 'pool_payout',
      amount: cut,
      user: holder._id,
      direction: 'credit',
      note: `Return from ${business.name}`,
    });
  }

  // Rounding dust stays in the fund.
  pool.balance += amount - distributed;
  pool.totalReturns += amount;
  await pool.save();

  return res.json({ distributed, retained: amount - distributed, totalReturns: pool.totalReturns });
});
