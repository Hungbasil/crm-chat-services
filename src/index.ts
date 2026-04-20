import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

// Import configurations
import { config, validateConfig } from './common/config/config';
import { getLogger } from './common/logger/Logger';

// Import middleware
import { authenticate, isAdminOrStaff, socketAuthWithRole } from './Middleware/auth';
import { requestLogger } from './Middleware/logging';
import { activityTracker } from './Middleware/activityTracker';
import {
  errorHandler,
  notFoundHandler,
  asyncHandler
} from './Middleware/errorHandler';
import { normalRateLimit } from './Middleware/rateLimit';

// Import routes
import authRoutes from './Routes/auth';
import dashboardRoutes from './Routes/dashboard';
import uploadRoutes from './Routes/upload';
import chatRoutes from './Routes/chat';
import aiConfigRoutes from './Routes/aiConfig';

// Import services
import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from './config/db';
import { ResponseHandler } from './common/response/ResponseHandler';
import { AIConfigHelper } from './common/helpers/AIConfigHelper';

// Validate configuration
validateConfig();

const logger = getLogger('Application');
const app = express();
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
    credentials: config.cors.credentials
  }
});

// ============= MIDDLEWARE STACK =============

// Request logging
app.use(requestLogger);

// CORS
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Activity tracking (must come after JSON parser and authentication headers are available)
app.use(activityTracker);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============= HEALTH CHECK =============
app.get('/health', (req, res) => {
  ResponseHandler.success(res, { status: 'OK' }, 'Server is running');
});

app.get('/', (req, res) => {
  ResponseHandler.success(
    res,
    { version: '2.0', message: 'CRM Chat API - Restructured Edition' },
    'Welcome to CRM Chat Service'
  );
});

// ============= API ROUTES =============
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/files', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai-config', aiConfigRoutes);

// ============= SOCKET.IO =============
async function analyzeMessageWithAI(
  messageId: string,
  content: string,
  conversationId: string,
  staffId?: string
): Promise<void> {
  try {
    // Load AI config (per-staff or global)
    const aiConfig = await AIConfigHelper.loadConfigForStaff(staffId);
    
    // Check if sentiment analysis is enabled
    if (!aiConfig.sentiment_analysis_enabled) {
      logger.debug('Sentiment analysis disabled, skipping AI analysis');
      return;
    }

    // Initialize Gemini model with config
    const model = genAI.getGenerativeModel({
      model: aiConfig.model_version,
      generationConfig: {
        temperature: aiConfig.temperature,
        maxOutputTokens: aiConfig.max_tokens,
        topP: aiConfig.top_p,
        stopSequences: []
      }
    });

    // Format system prompt based on tone
    const systemPrompt = AIConfigHelper.formatSystemPrompt(
      aiConfig.system_prompt,
      aiConfig.tone,
      aiConfig.language
    );

    const prompt = `
      ${systemPrompt}

      Phân tích tin nhắn của khách hàng sau: "${content}". 
      Hãy trả về kết quả định dạng JSON chuẩn xác với 2 trường:
      - "sentiment": Cảm xúc (Ví dụ: "tức giận", "hài lòng", "trung tính", "hỏi han").
      - "intent": Ý định chính (Ví dụ: "hỏi giá", "bảo hành", "khiếu nại", "mua hàng").
      Chỉ trả về JSON, không thêm bất kỳ văn bản nào khác.
    `;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI analysis timeout')), aiConfig.timeout_ms)
    );

    const aiResultPromise = model.generateContent(prompt);

    const aiResult = (await Promise.race([aiResultPromise, timeoutPromise])) as any;
    let aiText = aiResult.response.text();

    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiAnalysisJson = JSON.parse(aiText);

    await pool.query(
      'UPDATE messages SET ai_analysis = $1 WHERE id = $2',
      [aiAnalysisJson, messageId]
    );

    // Check if auto-escalation is enabled and sentiment is negative
    if (aiConfig.auto_escalation_enabled) {
      const sentimentScore = aiAnalysisJson.sentiment_score || 0;
      if (sentimentScore < aiConfig.escalation_threshold) {
        logger.info('Auto-escalation triggered', {
          messageId,
          sentiment: aiAnalysisJson.sentiment,
          score: sentimentScore
        });
        // TODO: Implement auto-escalation logic (assign to staff, notify, etc.)
      }
    }

    io.emit('ai_analyzed', {
      message_id: messageId,
      conversation_id: conversationId,
      ai_data: aiAnalysisJson
    });

    logger.info('AI analysis completed', {
      messageId,
      sentiment: aiAnalysisJson.sentiment,
      model: aiConfig.model_version,
      staffId: staffId || 'global'
    });
  } catch (error: any) {
    logger.error('AI analysis failed', error);
  }
}

io.use(socketAuthWithRole);

io.on('connection', (socket) => {
  const userInfo = (socket as any).user;
  logger.info('Client connected', { socketId: socket.id, userId: userInfo.userId });

  socket.on('send_message', async (data) => {
    try {
      let parsedData;
      try {
        parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      } catch (parseError: any) {
        logger.error('Invalid JSON format', parseError);
        socket.emit('error_message', { error: 'Invalid message format. Expected valid JSON.' });
        return;
      }
      
      const { conversation_id, sender_type, content } = parsedData;

      if (!conversation_id) {
        throw new Error('Missing conversation_id');
      }

      if (userInfo.role === 'STAFF' && sender_type !== 'STAFF') {
        socket.emit('error_message', {
          error: 'Staff can only send messages as STAFF'
        });
        return;
      }

      const result = await pool.query(
        'INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, $2, $3) RETURNING *',
        [conversation_id, sender_type, content]
      );

      const savedMessage = result.rows[0];

      logger.info('Message saved', {
        messageId: savedMessage.id,
        senderType: sender_type
      });

      io.emit('receive_message', savedMessage);

      if (sender_type === 'CUSTOMER') {
        // Use staff config if staff is analyzing, otherwise use global
        const staffId = userInfo.role === 'STAFF' ? userInfo.userId : undefined;
        analyzeMessageWithAI(savedMessage.id, content, conversation_id, staffId);
      }
    } catch (error: any) {
      logger.error('Message handling failed', error);
      socket.emit('error_message', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

// ============= ERROR HANDLING =============

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============= SERVER STARTUP =============
const server = httpServer.listen(config.port, '0.0.0.0', () => {
  logger.info(`🚀 Server started`, {
    port: config.port,
    environment: config.nodeEnv,
    database: `${config.database.host}:${config.database.port}/${config.database.name}`
  });
});

// Allow socket reuse
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${config.port} already in use`);
    process.exit(1);
  }
  throw err;
});

// Handle graceful shutdown
const gracefulShutdown = () => {
  logger.info('Shutting down gracefully...');
  io.close();
  server.close(() => {
    logger.info('Server closed');
    pool.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);