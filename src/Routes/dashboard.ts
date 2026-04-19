import { Router } from 'express';
import {
  getStats,
  getOnlineStaffCount,
  getActiveChatsCount,
  getSatisfactionRate,
  getSentimentAnalysis,
  getChannelStats
} from '../Controllers/dashboard';
import { authenticate, isAdmin } from '../Middleware/auth';
import { relaxedRateLimit } from '../Middleware/rateLimit';

const router = Router();

// [GET] Dashboard statistics (Admin only)
router.get('/stats', authenticate, isAdmin, relaxedRateLimit, getStats);

// [GET] Online staff count (Admin only)
router.get('/online-staff', authenticate, isAdmin, relaxedRateLimit, getOnlineStaffCount);

// [GET] Active chats count (Admin only)
router.get('/active-chats', authenticate, isAdmin, relaxedRateLimit, getActiveChatsCount);

// [GET] Satisfaction rate (Admin only)
router.get('/satisfaction-rate', authenticate, isAdmin, relaxedRateLimit, getSatisfactionRate);

// [GET] Sentiment analysis details (Admin only)
router.get('/sentiment', authenticate, isAdmin, relaxedRateLimit, getSentimentAnalysis);

// [GET] Channel statistics (Admin only)
router.get('/channel-stats', authenticate, isAdmin, relaxedRateLimit, getChannelStats);

export default router;
