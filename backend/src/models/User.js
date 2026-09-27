import mongoose from 'mongoose';
import { customAlphabet } from '../utils/ids.js';

const nanoCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: '' },
    language: { type: String, enum: ['en', 'hi'], default: 'hi' },
    city: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    role: { type: String, enum: ['buyer', 'seller'], default: 'buyer' },

    // Referral graph
    referralCode: { type: String, unique: true, index: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Wallet
    walletBalance: { type: Number, default: 0 }, // spendable credit, in paise
    lifetimeEarnings: { type: Number, default: 0 }, // referral + pool payouts, in paise

    // Investment pool
    poolUnits: { type: Number, default: 0 }, // share units held in the community pool

    // OTP login
    otpHash: { type: String, default: null, select: false },
    otpExpiresAt: { type: Date, default: null, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.pre('save', function assignReferralCode(next) {
  if (!this.referralCode) this.referralCode = nanoCode();
  next();
});

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    phone: this.phone,
    name: this.name,
    language: this.language,
    city: this.city,
    avatarUrl: this.avatarUrl,
    role: this.role,
    referralCode: this.referralCode,
    walletBalance: this.walletBalance,
    lifetimeEarnings: this.lifetimeEarnings,
    poolUnits: this.poolUnits,
    verified: this.verified,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
