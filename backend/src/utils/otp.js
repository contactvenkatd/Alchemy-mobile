import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import twilio from 'twilio';
import { env } from '../config/env.js';

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

const { accountSid, authToken, fromNumber } = env.twilio;
const smsClient = accountSid && authToken && fromNumber ? twilio(accountSid, authToken) : null;

/** Sends via Twilio when fully configured; otherwise logs to the console for local dev. */
export async function sendOtpSms(phone, otp) {
  if (!smsClient) {
    console.log(`[otp] ${phone} -> ${otp}`);
    return;
  }
  await smsClient.messages.create({
    to: phone, // already E.164
    from: fromNumber,
    body: `${otp} is your Alchemy verification code. It expires in 5 minutes.`,
  });
}
