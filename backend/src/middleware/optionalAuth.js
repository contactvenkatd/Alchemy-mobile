import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';

/** Attaches req.user when a valid token is present, but never rejects. */
export async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      const payload = verifyToken(header.slice(7));
      req.user = await User.findById(payload.sub);
    }
  } catch {
    // Anonymous request — carry on.
  }
  next();
}
