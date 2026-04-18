import pool from '../config/db';
import { getLogger } from '../common/logger/Logger';
import { NotFoundError, DatabaseError } from '../common/errors/AppError';
import { Validator } from '../common/config/Validator';

const logger = getLogger('ChatService');

export interface MessageResponse {
  id: string;
  conversation_id: string;
  sender_type: 'CUSTOMER' | 'STAFF';
  content: string;
  ai_analysis?: any;
  is_image?: boolean;
  created_at: string;
}

/**
 * Chat Service - Handle messaging operations
 */
export class ChatService {
  /**
   * Get all messages for a conversation
   */
  static async getConversationMessages(
    conversationId: string
  ): Promise<MessageResponse[]> {
    try {
      // Validate input
      Validator.uuid(conversationId, 'Conversation ID');

      logger.info('Fetching conversation messages', { conversationId });

      // Query messages from database
      const result = await pool.query(
        `SELECT 
          id, 
          conversation_id, 
          sender_type, 
          content, 
          ai_analysis,
          created_at,
          (content LIKE '%.jpg' OR content LIKE '%.png' OR content LIKE '%.gif' OR content LIKE '%.webp') as is_image
        FROM messages 
        WHERE conversation_id = $1 
        ORDER BY created_at ASC`,
        [conversationId]
      );

      if (result.rows.length === 0) {
        logger.debug('No messages found', { conversationId });
      }

      logger.info('Messages fetched', { 
        conversationId, 
        count: result.rows.length 
      });

      return result.rows;
    } catch (error: any) {
      logger.error('Get messages error', error);
      throw new DatabaseError('Failed to fetch conversation messages', error);
    }
  }

  /**
   * Get message by ID
   */
  static async getMessageById(messageId: string): Promise<MessageResponse> {
    try {
      Validator.uuid(messageId, 'Message ID');

      logger.debug('Fetching message', { messageId });

      const result = await pool.query(
        `SELECT * FROM messages WHERE id = $1`,
        [messageId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Message');
      }

      return result.rows[0];
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Get message error', error);
      throw new DatabaseError('Failed to fetch message', error);
    }
  }

  /**
   * Get recent conversations
   */
  static async getRecentConversations(limit: number = 10): Promise<any[]> {
    try {
      logger.debug('Fetching recent conversations', { limit });

      const result = await pool.query(
        `SELECT DISTINCT c.id, c.customer_id, c.status, c.created_at, u.full_name as customer_name
         FROM conversations c
         LEFT JOIN customers u ON c.customer_id = u.id
         ORDER BY c.created_at DESC
         LIMIT $1`,
        [limit]
      );

      logger.info('Recent conversations fetched', { count: result.rows.length });

      return result.rows;
    } catch (error: any) {
      logger.error('Get conversations error', error);
      throw new DatabaseError('Failed to fetch conversations', error);
    }
  }
}
