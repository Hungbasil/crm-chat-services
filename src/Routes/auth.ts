import { Router } from 'express';
import { register, login, getProfile, updateUserRole, updateStaffActivity } from '../Controllers/auth';
import { authenticate, isAdmin } from '../Middleware/auth';
import { validateBody, validateParams } from '../Middleware/validation';
import { strictRateLimit } from '../Middleware/rateLimit';

const router = Router();

// Public endpoints - with strict rate limiting
router.post('/register', strictRateLimit, validateBody(['email', 'password', 'full_name']), register);
router.post('/login', strictRateLimit, validateBody(['email', 'password']), login);

// Protected endpoints
router.get('/profile', authenticate, getProfile);
router.put('/users/:userId/role', authenticate, isAdmin, validateParams(['userId']), validateBody(['role']), updateUserRole);

// Staff activity tracking
router.post('/activity', authenticate, updateStaffActivity);

export default router;