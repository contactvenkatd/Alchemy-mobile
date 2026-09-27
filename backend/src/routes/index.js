import { Router } from 'express';
import auth from './auth.js';
import users from './users.js';
import products from './products.js';
import posts from './posts.js';
import transactions from './transactions.js';
import pool from './pool.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
router.use('/auth', auth);
router.use('/users', users);
router.use('/products', products);
router.use('/posts', posts);
router.use('/transactions', transactions);
router.use('/pool', pool);

export default router;
