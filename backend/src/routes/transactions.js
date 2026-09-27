import { Router } from 'express';
import {
  purchase, listTransactions, getWallet, topup, purchaseSchema, topupSchema,
} from '../controllers/transactionController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listTransactions);
router.get('/wallet', getWallet);
router.post('/purchase', validate(purchaseSchema), purchase);
router.post('/topup', validate(topupSchema), topup);

export default router;
