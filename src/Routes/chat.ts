import { Router } from 'express';
import {
  getConversationMessages,
  getMessageById,
  getRecentConversations,
  getChatList
} from '../Controllers/chat';
import { authenticate } from '../Middleware/auth';
import { validateParams, validateQuery } from '../Middleware/validation';
import { relaxedRateLimit } from '../Middleware/rateLimit';

const router = Router();

// [GET] Get paginated chat list
router.get(
  '/list',
  authenticate,
  relaxedRateLimit,
  getChatList
);

// [GET] Get recent conversations
router.get(
  '/conversations',
  authenticate,
  relaxedRateLimit,
  getRecentConversations
);

// [GET] Get conversation messages
router.get(
  '/:conversationId',
  authenticate,
  relaxedRateLimit,
  validateParams(['conversationId']),
  getConversationMessages
);

// [GET] Get message by ID
router.get(
  '/message/:messageId',
  authenticate,
  relaxedRateLimit,
  validateParams(['messageId']),
  getMessageById
);

export default router;
