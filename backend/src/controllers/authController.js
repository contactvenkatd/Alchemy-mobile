import { z } from 'zod';
import { User } from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { generateOtp, hashOtp, compareOtp, otpExpiry, sendOtpSms } from '../utils/otp.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

export const requestOtpSchema = z.object({
  phone: phoneSchema,
  referralCode: z.string().trim().toUpperCase().optional(),
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  name: z.string().trim().max(60).optional(),
  language: z.enum(['en', 'hi']).optional(),
  city: z.string().trim().max(60).optional(),
});

/**
 * POST /api/auth/request-otp
 * Creates the user on first contact — signup and login are the same flow.
 */
export const requestOtp = asyncHandler(async (req, res) => {
  const { phone, referralCode } = req.body;

  let user = await User.findOne({ phone }).select('+otpHash +otpExpiresAt +otpAttempts');
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) referredBy = referrer._id;
    }
    user = new User({ phone, referredBy });
  }

  const otp = generateOtp();
  user.otpHash = await hashOtp(otp);
  user.otpExpiresAt = otpExpiry();
  user.otpAttempts = 0;
  await user.save();

  await sendOtpSms(phone, otp);

  res.json({
    message: 'OTP sent',
    isNewUser,
    expiresAt: user.otpExpiresAt,
    // Dev convenience only — never leak the OTP in production.
    ...(env.otpDevMode ? { devOtp: otp } : {}),
  });
});

/**
 * POST /api/auth/verify-otp
 * Returns a JWT. Also fills in profile fields sent during signup.
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp, name, language, city } = req.body;

  const user = await User.findOne({ phone }).select('+otpHash +otpExpiresAt +otpAttempts');
  if (!user) return res.status(404).json({ error: 'Number not registered. Request an OTP first.' });

  if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    return res.status(400).json({ error: 'OTP expired. Request a new one.' });
  }
  if (user.otpAttempts >= 5) {
    return res.status(429).json({ error: 'Too many wrong attempts. Request a new OTP.' });
  }

  const ok = await compareOtp(otp, user.otpHash);
  if (!ok) {
    user.otpAttempts += 1;
    await user.save();
    return res.status(400).json({ error: 'Wrong OTP' });
  }

  user.otpHash = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
  user.verified = true;
  if (name) user.name = name;
  if (language) user.language = language;
  if (city) user.city = city;
  await user.save();

  return res.json({ token: signToken(user._id), user: user.toPublic() });
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toPublic() });
});
