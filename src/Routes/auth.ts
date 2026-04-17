import { Router } from 'express';
import { register, login, getProfile, updateUserRole } from '../Controllers/auth';
import { authenticate, isAdmin } from '../Middleware/auth';

const router = Router();

// Công khai - không cần xác thực
router.post('/register', register);
router.post('/login', login);

// Cần xác thực
router.get('/profile', authenticate, getProfile);

// Chỉ ADMIN mới có quyền thay đổi role
router.put('/users/:userId/role', authenticate, isAdmin, updateUserRole);

export default router;