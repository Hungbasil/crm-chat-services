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

export interface ChatListItemResponse {
  id: string;
  customer_id: string;
  customer_name: string;
  channel: string;
  status: string;
  latest_message: string;
  latest_sentiment: string;
  created_at: string;
  updated_at: string;
  total_messages: number;
}

export interface PaginatedChatListResponse {
  data: ChatListItemResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

  /**
   * Get paginated chat list with latest message and sentiment
   */
  static async getChatList(
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<PaginatedChatListResponse> {
    try {
      // Validate pagination parameters
      Validator.number(page, 'Page', 1);
      Validator.number(limit, 'Limit', 1, 100);

      const offset = (page - 1) * limit;

      logger.debug('Fetching chat list', { page, limit, offset, status });

      // Build dynamic query
      let whereClause = '';
      const queryParams: any[] = [];

      if (status) {
        whereClause = 'WHERE c.status = $1';
        queryParams.push(status);
      }

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM conversations c ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].total, 10);

      // Get paginated results with latest message and sentiment
      const paramIndex = queryParams.length + 1;
      const query = `
        SELECT 
          c.id,
          c.customer_id,
          COALESCE(cu.name, 'Unknown Customer') as customer_name,
          COALESCE(c.channel, 'WEBSITE') as channel,
          c.status,
          COALESCE(m.content, '') as latest_message,
          COALESCE(m.ai_analysis->>'sentiment', 'trung tính') as latest_sentiment,
          c.created_at,
          c.created_at as updated_at,
          (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as total_messages
        FROM conversations c
        LEFT JOIN customers cu ON c.customer_id = cu.id
        LEFT JOIN LATERAL (
          SELECT content, ai_analysis
          FROM messages
          WHERE conversation_id = c.id
          ORDER BY created_at DESC
          LIMIT 1
        ) m ON true
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const dataResult = await pool.query(query, [...queryParams, limit, offset]);

      logger.info('Chat list fetched', {
        page,
        limit,
        total,
        count: dataResult.rows.length,
      });

      return {
        data: dataResult.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      logger.error('Get chat list error', error);
      throw new DatabaseError('Failed to fetch chat list', error);
    }
  }
}
