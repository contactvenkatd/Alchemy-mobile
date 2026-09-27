import { Router } from 'express';
import { updateProfile, earningsSummary, updateProfileSchema } from '../controllers/userController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.patch('/me', requireAuth, validate(updateProfileSchema), updateProfile);
router.get('/me/summary', requireAuth, earningsSummary);

export default router;
