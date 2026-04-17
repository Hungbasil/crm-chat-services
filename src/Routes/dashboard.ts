import { Router } from 'express';
import pool from '../config/db';
import { authenticate, isAdmin } from '../Middleware/auth';

const router = Router();

// [GET] Lấy tất cả thống kê dashboard (chỉ ADMIN)
router.get('/stats', authenticate, isAdmin, async (req, res) => {
  try {
    // 1. Tính tổng số tin nhắn
    const totalMessagesQuery = `SELECT COUNT(*) as total FROM messages;`;
    const totalMessagesResult = await pool.query(totalMessagesQuery);
    const totalMessages = parseInt(totalMessagesResult.rows[0].total, 10);

    // 2. Phân tích cảm xúc (Sentiment Analysis)
    const sentimentQuery = `
      SELECT 
        (ai_analysis->>'sentiment') as sentiment,
        COUNT(*) as count
      FROM messages
      WHERE ai_analysis IS NOT NULL 
        AND ai_analysis->>'sentiment' IS NOT NULL
      GROUP BY ai_analysis->>'sentiment'
      ORDER BY count DESC;
    `;
    const sentimentResult = await pool.query(sentimentQuery);
    const sentimentAnalysis = sentimentResult.rows;

    // 3. 5 cuộc hội thoại mới nhất kèm thông tin khách hàng
    const recentConversationsQuery = `
      SELECT 
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
      LIMIT 5;
    `;
    const recentConversationsResult = await pool.query(recentConversationsQuery);
    const recentConversations = recentConversationsResult.rows;

    // 4. Thống kê tin nhắn theo ngày (7 ngày gần đây)
    const messageTrendQuery = `
      SELECT 
        DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') as date,
        COUNT(*) as count
      FROM messages
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')
      ORDER BY date ASC;
    `;
    const messageTrendResult = await pool.query(messageTrendQuery);
    const messageTrend = messageTrendResult.rows;

    // 5. Danh sách staff
    const staffListQuery = `
      SELECT id, full_name, role, created_at
      FROM users
      WHERE role IN ('ADMIN', 'STAFF')
      ORDER BY created_at DESC;
    `;
    const staffListResult = await pool.query(staffListQuery);
    const staffList = staffListResult.rows;

    res.json({
      totalMessages,
      sentimentAnalysis,
      recentConversations,
      messageTrend,
      staffList
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê dashboard:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thống kê' });
  }
});

// [GET] Lấy sentiment analysis chi tiết
router.get('/sentiment', authenticate, isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        (ai_analysis->>'sentiment') as sentiment,
        (ai_analysis->>'intent') as intent,
        COUNT(*) as count
      FROM messages
      WHERE ai_analysis IS NOT NULL
      GROUP BY 
        ai_analysis->>'sentiment',
        ai_analysis->>'intent'
      ORDER BY count DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Lỗi lấy sentiment:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// [GET] Lấy thống kê theo channel
router.get('/channel-stats', authenticate, isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        c.channel,
        COUNT(DISTINCT c.id) as conversation_count,
        COUNT(m.id) as message_count
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      GROUP BY c.channel
      ORDER BY message_count DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Lỗi lấy thống kê channel:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default router;
