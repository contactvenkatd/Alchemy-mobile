import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/alchemy',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  otpDevMode: process.env.OTP_DEV_MODE !== 'false',
};

// The split applied to every purchase. Must add up to 1.
export const SPLIT = {
  seller: 0.9,
  referrer: 0.05,
  pool: 0.05,
};
