import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';   
import pool from './config/db';
import authRoutes from './Routes/auth';
import dashboardRoutes from './Routes/dashboard';
import { authenticate, isAdminOrStaff, socketAuthWithRole } from './Middleware/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import jwt from 'jsonwebtoken';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Chào mừng đến với Hệ thống Backend CRM đa kênh!');
});

// API lấy lịch sử chat - cần xác thực
app.get('/api/chat/:conversation_id', authenticate, async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const query = `
      SELECT * FROM messages 
      WHERE conversation_id = $1 
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [conversation_id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Lỗi khi tải lịch sử:', error);
    res.status(500).json({ error: 'Không thể tải lịch sử tin nhắn' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

async function analyzeMessageWithAI(messageId: string, content: string, conversationId: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      Phân tích tin nhắn của khách hàng sau: "${content}". 
      Hãy trả về kết quả định dạng JSON chuẩn xác với 2 trường:
      - "sentiment": Cảm xúc (Ví dụ: "tức giận", "hài lòng", "trung tính", "hỏi han").
      - "intent": Ý định chính (Ví dụ: "hỏi giá", "bảo hành", "khiếu nại", "mua hàng").
      Chỉ trả về JSON, không thêm bất kỳ văn bản nào khác.
    `;

    const aiResult = await model.generateContent(prompt);
    let aiText = aiResult.response.text();

    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiAnalysisJson = JSON.parse(aiText);

    const updateQuery = `UPDATE messages SET ai_analysis = $1 WHERE id = $2 RETURNING *;`;
    await pool.query(updateQuery, [aiAnalysisJson, messageId]);

    io.emit('ai_analyzed', { 
      message_id: messageId, 
      conversation_id: conversationId,
      ai_data: aiAnalysisJson 
    });

    console.log('🤖 AI đã phân tích xong:', aiAnalysisJson);

  } catch (error) {
    console.error('⚠️ Lỗi khi gọi Gemini AI:', error);
  }
}

io.use(socketAuthWithRole);

io.on('connection', (socket) => {
  const userInfo = (socket as any).user;
  console.log(`🔌 Client vừa kết nối! ID: ${socket.id} | User: ${userInfo.userId} | Role: ${userInfo.role}`);

  socket.on('send_message', async (data) => {
    try {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      const { conversation_id, sender_type, content } = parsedData;

      if (!conversation_id) throw new Error("Thiếu conversation_id");
      
      // Kiểm tra quyền: STAFF chỉ có thể gửi tin nhắn với sender_type = 'STAFF'
      if (userInfo.role === 'STAFF' && sender_type !== 'STAFF') {
        socket.emit('error_message', { error: 'STAFF chỉ có thể gửi tin nhắn dưới tên STAFF' });
        return;
      }

      const insertQuery = `
        INSERT INTO messages (conversation_id, sender_type, content) 
        VALUES ($1, $2, $3) RETURNING *;
      `;
      const result = await pool.query(insertQuery, [conversation_id, sender_type, content]);
      const savedMessage = result.rows[0];
      
      console.log(`✉️  Nhận & Lưu tin nhắn từ ${socket.id} thành công!`);

      io.emit('receive_message', savedMessage);
      if (sender_type === 'CUSTOMER') {
        analyzeMessageWithAI(savedMessage.id, content, conversation_id);
      }

    } catch (error) {
      console.error('⚠️ Lỗi xử lý tin nhắn:', error);
      socket.emit('error_message', { error: 'Không thể xử lý tin nhắn' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client đã ngắt kết nối: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(` Server & Socket.io đang chạy tại: http://localhost:${port}`);
});