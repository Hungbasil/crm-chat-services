/**
 * Auth DTOs
 */

export interface RegisterRequestDTO {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: 'ADMIN' | 'STAFF';
  };
}

export interface UpdateUserRoleDTO {
  role: 'ADMIN' | 'STAFF' | 'AGENT';
}

/**
 * Chat DTOs
 */

export interface SendMessageDTO {
  conversation_id: string;
  sender_type: 'CUSTOMER' | 'STAFF';
  content: string;
}

export interface MessageResponseDTO {
  id: string;
  conversation_id: string;
  sender_type: 'CUSTOMER' | 'STAFF';
  content: string;
  ai_analysis?: {
    sentiment: string;
    intent: string;
  };
  created_at: string;
}

/**
 * File Upload DTOs
 */

export interface FileUploadRequestDTO {
  conversation_id: string;
  sender_type: 'CUSTOMER' | 'STAFF';
}

export interface FileUploadResponseDTO {
  id: string;
  conversation_id: string;
  sender_type: 'CUSTOMER' | 'STAFF';
  content: string;
  file: {
    filename: string;
    originalname: string;
    size: number;
    url: string;
  };
  created_at: string;
}

/**
 * Dashboard DTOs
 */

export interface DashboardStatsResponseDTO {
  totalMessages: number;
  sentimentAnalysis: Array<{
    sentiment: string;
    count: number;
  }>;
  recentConversations: Array<{
    id: string;
    customer_name: string;
    channel: string;
    latest_message: string;
    latest_sentiment: string;
    created_at: string;
  }>;
  messageTrend: Array<{
    date: string;
    count: number;
  }>;
  staffList: Array<{
    id: string;
    full_name: string;
    role: string;
    created_at: string;
  }>;
}

export interface SentimentAnalysisDTO {
  sentiment: string;
  intent: string;
  count: number;
}

export interface ChannelStatsDTO {
  channel: string;
  conversation_count: number;
  message_count: number;
}
