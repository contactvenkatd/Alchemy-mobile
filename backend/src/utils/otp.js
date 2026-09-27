import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const OTP_TTL_MS = 5 * 60 * 1000;

export function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

export async function hashOtp(otp) {
  return bcrypt.hash(otp, 8);
}

export async function compareOtp(otp, hash) {
  if (!hash) return false;
  return bcrypt.compare(otp, hash);
}

export function otpExpiry() {
  return new Date(Date.now() + OTP_TTL_MS);
}

/** Swap this for an SMS gateway (MSG91 / Gupshup / Twilio) in production. */
export async function sendOtpSms(phone, otp) {
  console.log(`[otp] ${phone} -> ${otp}`);
}
