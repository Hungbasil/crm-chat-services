import pool from '../config/db';
import { getLogger } from '../common/logger/Logger';
import { DatabaseError } from '../common/errors/AppError';
import {
  DashboardStatsResponseDTO,
  SentimentAnalysisDTO,
  ChannelStatsDTO
} from '../dto';

const logger = getLogger('DashboardService');

/**
 * Dashboard Service
 */
export class DashboardService {
  /**
   * Get all dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStatsResponseDTO> {
    try {
      logger.info('Fetching dashboard statistics');

      // 1. Total messages
      const totalMessagesResult = await pool.query(
        'SELECT COUNT(*) as total FROM messages'
      );
      const totalMessages = parseInt(totalMessagesResult.rows[0].total, 10);

      // 2. Sentiment analysis
      const sentimentResult = await pool.query(
        `SELECT 
          (ai_analysis->>'sentiment') as sentiment,
          COUNT(*) as count
        FROM messages
        WHERE ai_analysis IS NOT NULL 
          AND ai_analysis->>'sentiment' IS NOT NULL
        GROUP BY ai_analysis->>'sentiment'
        ORDER BY count DESC`
      );
      const sentimentAnalysis = sentimentResult.rows;

      // 3. Recent conversations
      const recentConversationsResult = await pool.query(
        `SELECT 
          c.id,
          cust.name as customer_name,
          c.channel,
          m.content as latest_message,
          (m.ai_analysis->>'sentiment') as latest_sentiment,
          c.created_at
        FROM conversations c
        LEFT JOIN customers cust ON c.customer_id = cust.id
        LEFT JOIN messages m ON c.id = m.conversation_id
        ORDER BY c.created_at DESC
        LIMIT 5`
      );
      const recentConversations = recentConversationsResult.rows;

      // 4. Message trend (7 days)
      const messageTrendResult = await pool.query(
        `SELECT 
          DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') as date,
          COUNT(*) as count
        FROM messages
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')
        ORDER BY date ASC`
      );
      const messageTrend = messageTrendResult.rows;

      // 5. Staff list
      const staffListResult = await pool.query(
        `SELECT id, full_name, role, created_at
        FROM users
        WHERE role IN ('ADMIN', 'STAFF')
        ORDER BY created_at DESC`
      );
      const staffList = staffListResult.rows;

      logger.info('Dashboard statistics fetched successfully');

      return {
        totalMessages,
        sentimentAnalysis,
        recentConversations,
        messageTrend,
        staffList
      };
    } catch (error: any) {
      logger.error('Dashboard statistics fetch error', error);
      throw new DatabaseError('Failed to fetch dashboard statistics', error);
    }
  }

  /**
   * Get sentiment analysis details
   */
  static async getSentimentAnalysis(): Promise<SentimentAnalysisDTO[]> {
    try {
      logger.info('Fetching sentiment analysis');

      const result = await pool.query(
        `SELECT 
          (ai_analysis->>'sentiment') as sentiment,
          (ai_analysis->>'intent') as intent,
          COUNT(*) as count
        FROM messages
        WHERE ai_analysis IS NOT NULL
        GROUP BY 
          ai_analysis->>'sentiment',
          ai_analysis->>'intent'
        ORDER BY count DESC`
      );

      logger.info('Sentiment analysis fetched successfully');
      return result.rows;
    } catch (error: any) {
      logger.error('Sentiment analysis fetch error', error);
      throw new DatabaseError('Failed to fetch sentiment analysis', error);
    }
  }

  /**
   * Get channel statistics
   */
  static async getChannelStats(): Promise<ChannelStatsDTO[]> {
    try {
      logger.info('Fetching channel statistics');

      const result = await pool.query(
        `SELECT 
          c.channel,
          COUNT(DISTINCT c.id) as conversation_count,
          COUNT(m.id) as message_count
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        GROUP BY c.channel
        ORDER BY message_count DESC`
      );

      logger.info('Channel statistics fetched successfully');
      return result.rows;
    } catch (error: any) {
      logger.error('Channel statistics fetch error', error);
      throw new DatabaseError('Failed to fetch channel statistics', error);
    }
  }
}
