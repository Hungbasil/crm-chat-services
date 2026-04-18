import { Router } from 'express';
import {
  getStats,
  getSentimentAnalysis,
  getChannelStats
} from '../Controllers/dashboard';
import { authenticate, isAdmin } from '../Middleware/auth';
import { relaxedRateLimit } from '../Middleware/rateLimit';

const router = Router();

// [GET] Dashboard statistics (Admin only)
router.get('/stats', authenticate, isAdmin, relaxedRateLimit, getStats);

// [GET] Sentiment analysis details (Admin only)
router.get('/sentiment', authenticate, isAdmin, relaxedRateLimit, getSentimentAnalysis);

// [GET] Channel statistics (Admin only)
router.get('/channel-stats', authenticate, isAdmin, relaxedRateLimit, getChannelStats);

export default router;
