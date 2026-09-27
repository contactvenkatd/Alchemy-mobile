import { Router } from 'express';
import {
  listPosts, getPost, createPost, toggleLike, addComment, sharePost, createPostSchema, commentSchema,
} from '../controllers/postController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = Router();

router.get('/', optionalAuth, listPosts);
router.get('/:id', optionalAuth, getPost);
router.post('/', requireAuth, validate(createPostSchema), createPost);
router.post('/:id/like', requireAuth, toggleLike);
router.post('/:id/comment', requireAuth, validate(commentSchema), addComment);
router.post('/:id/share', requireAuth, sharePost);

export default router;
