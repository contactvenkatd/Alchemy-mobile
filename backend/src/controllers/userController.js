import { z } from 'zod';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { Pool } from '../models/Pool.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const updateProfileSchema = z.object({
  name: z.string().trim().max(60).optional(),
  language: z.enum(['en', 'hi']).optional(),
  city: z.string().trim().max(60).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  role: z.enum(['buyer', 'seller']).optional(),
});

/** PATCH /api/users/me */
export const updateProfile = asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();
  res.json({ user: req.user.toPublic() });
});

/**
 * GET /api/users/me/summary
 * Everything the Profile screen needs in one round trip.
 */
export const earningsSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [byType, referralCount, pool] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: userId, direction: 'credit', status: 'completed' } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    User.countDocuments({ referredBy: userId }),
    Pool.getMain(),
  ]);

  const totals = Object.fromEntries(byType.map((r) => [r._id, r.total]));
  const sharePercent = pool.totalUnits > 0 ? (req.user.poolUnits / pool.totalUnits) * 100 : 0;

  res.json({
    walletBalance: req.user.walletBalance,
    lifetimeEarnings: req.user.lifetimeEarnings,
    referralEarnings: totals.referral_bonus || 0,
    cashbackEarnings: totals.cashback || 0,
    sellerEarnings: totals.seller_payout || 0,
    poolPayouts: totals.pool_payout || 0,
    referralCount,
    referralCode: req.user.referralCode,
    referralLink: `https://alchemy.app/join?ref=${req.user.referralCode}`,
    pool: {
      units: req.user.poolUnits,
      sharePercent: Number(sharePercent.toFixed(4)),
    },
  });
});
