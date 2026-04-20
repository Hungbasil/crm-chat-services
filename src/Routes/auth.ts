import { Router } from 'express';
import { register, login, getProfile, updateUserRole, updateStaffActivity, getStaffList, getStaffById, deleteStaff } from '../Controllers/auth';
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

// Staff Management (Admin only)
router.get('/staff', authenticate, isAdmin, getStaffList);
router.get('/staff/:staffId', authenticate, isAdmin, validateParams(['staffId']), getStaffById);
router.delete('/staff/:staffId', authenticate, isAdmin, validateParams(['staffId']), deleteStaff);

export default router;