import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { User } from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

const googleClient = new OAuth2Client();
const appleKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

const baseSchema = {
  idToken: z.string().min(1),
  referralCode: z.string().trim().toUpperCase().optional(),
  language: z.enum(['en', 'hi']).optional(),
};

export const googleAuthSchema = z.object(baseSchema);

export const appleAuthSchema = z.object({
  ...baseSchema,
  // Apple only hands the name to the app on the very first sign-in, never in the token.
  name: z.string().trim().max(60).optional(),
});

/**
 * Finds the user by provider ID, else links an existing account with the same
 * verified email, else creates one. Signup and login are the same flow, as with OTP.
 */
async function findOrCreate({ provider, providerId, email, emailVerified, name, avatarUrl, referralCode, language }) {
  let user = await User.findOne({ [provider]: providerId });
  let isNewUser = false;

  if (!user && email && emailVerified) {
    user = await User.findOne({ email });
    if (user) user[provider] = providerId;
  }

  if (!user) {
    isNewUser = true;
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) referredBy = referrer._id;
    }
    user = new User({ [provider]: providerId, email: emailVerified ? email : undefined, referredBy });
  }

  user.verified = true;
  if (!user.name && name) user.name = name;
  if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl;
  if (isNewUser && language) user.language = language;
  await user.save();

  return { user, isNewUser };
}

/** POST /api/auth/google — body: { idToken } from @react-native-google-signin. */
export const googleAuth = asyncHandler(async (req, res) => {
  if (!env.googleClientIds.length) return res.status(503).json({ error: 'Google sign-in is not configured' });

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: req.body.idToken, audience: env.googleClientIds });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Invalid Google token' });
  }

  const { user, isNewUser } = await findOrCreate({
    provider: 'googleId',
    providerId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: payload.name,
    avatarUrl: payload.picture,
    referralCode: req.body.referralCode,
    language: req.body.language,
  });

  res.json({ token: signToken(user._id), user: user.toPublic(), isNewUser });
});

/** POST /api/auth/apple — body: { idToken, name? } from expo-apple-authentication. */
export const appleAuth = asyncHandler(async (req, res) => {
  if (!env.appleClientIds.length) return res.status(503).json({ error: 'Apple sign-in is not configured' });

  let payload;
  try {
    ({ payload } = await jwtVerify(req.body.idToken, appleKeys, {
      issuer: 'https://appleid.apple.com',
      audience: env.appleClientIds,
    }));
  } catch {
    return res.status(401).json({ error: 'Invalid Apple token' });
  }

  const { user, isNewUser } = await findOrCreate({
    provider: 'appleId',
    providerId: payload.sub,
    email: payload.email,
    // Apple sends this as a boolean or the string "true" depending on the flow.
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
    name: req.body.name,
    referralCode: req.body.referralCode,
    language: req.body.language,
  });

  res.json({ token: signToken(user._id), user: user.toPublic(), isNewUser });
});
