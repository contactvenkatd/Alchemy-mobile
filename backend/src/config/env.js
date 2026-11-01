import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/alchemy',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  otpDevMode: process.env.OTP_DEV_MODE !== 'false',
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',
  },
  // Comma-separated: the web, iOS and Android OAuth client IDs all mint tokens for the same app.
  googleClientIds: (process.env.GOOGLE_CLIENT_ID || '').split(',').map((s) => s.trim()).filter(Boolean),
  // The iOS bundle ID for native Sign in with Apple (or a Services ID for web).
  appleClientIds: (process.env.APPLE_CLIENT_ID || '').split(',').map((s) => s.trim()).filter(Boolean),
};

// The split applied to every purchase. Must add up to 1.
export const SPLIT = {
  seller: 0.9,
  referrer: 0.05,
  pool: 0.05,
};
