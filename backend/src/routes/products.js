import { Router } from 'express';
import {
  listProducts, getProduct, createProduct, updateProduct, listCategories, createProductSchema,
} from '../controllers/productController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', listProducts);
router.get('/meta/categories', listCategories);
router.get('/:id', getProduct);
router.post('/', requireAuth, validate(createProductSchema), createProduct);
router.patch('/:id', requireAuth, updateProduct);

export default router;
