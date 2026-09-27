import { Router } from 'express';
import { getPool, myShare, fundBusiness, recordReturn, fundBusinessSchema } from '../controllers/poolController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = Router();

router.get('/', optionalAuth, getPool);
router.get('/me', requireAuth, myShare);
router.post('/businesses', requireAuth, validate(fundBusinessSchema), fundBusiness);
router.post('/businesses/:id/return', requireAuth, recordReturn);

export default router;
