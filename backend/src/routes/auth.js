import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requestOtp, verifyOtp, me, requestOtpSchema, verifyOtpSchema } from '../controllers/authController.js';
import { googleAuth, appleAuth, googleAuthSchema, appleAuthSchema } from '../controllers/socialAuthController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const otpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });
const socialLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

router.post('/request-otp', otpLimiter, validate(requestOtpSchema), requestOtp);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/google', socialLimiter, validate(googleAuthSchema), googleAuth);
router.post('/apple', socialLimiter, validate(appleAuthSchema), appleAuth);
router.get('/me', requireAuth, me);

export default router;
