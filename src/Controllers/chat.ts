import { Request, Response } from 'express';
import { ResponseHandler } from '../common/response/ResponseHandler';
import { asyncHandler } from '../Middleware/errorHandler';
import { ChatService } from '../services/ChatService';

/**
 * [GET] Get conversation messages
 */
export const getConversationMessages = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const conversationId = Array.isArray(req.params.conversationId)
      ? req.params.conversationId[0]
      : req.params.conversationId;
    const messages = await ChatService.getConversationMessages(conversationId);
    ResponseHandler.success(res, messages, 'Messages retrieved successfully');
  }
);

/**
 * [GET] Get message by ID
 */
export const getMessageById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const messageId = Array.isArray(req.params.messageId)
      ? req.params.messageId[0]
      : req.params.messageId;
    const message = await ChatService.getMessageById(messageId);
    ResponseHandler.success(res, message, 'Message retrieved successfully');
  }
);

/**
 * [GET] Get recent conversations
 */
export const getRecentConversations = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    let limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    
    // Validate limit parameter
    if (isNaN(limit) || limit < 1 || limit > 100) {
      limit = 10; // Default if invalid
    }
    
    const conversations = await ChatService.getRecentConversations(limit);
    ResponseHandler.success(res, conversations, 'Conversations retrieved successfully');
  }
);
