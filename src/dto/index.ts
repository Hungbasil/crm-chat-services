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

export interface StaffActivityDTO {
  user_id: string;
  activity_type: 'LOGIN' | 'LOGOUT' | 'IDLE' | 'ACTIVE';
}

export interface StaffStatusDTO {
  id: string;
  full_name: string;
  role: string;
  is_online: boolean;
  last_activity: string;
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

export interface ChatListItemDTO {
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

export interface PaginatedChatListDTO {
  data: ChatListItemDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
  onlineStaffCount: number;
  activeChatsCount: number;
  satisfactionRate: number;
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
    is_online: boolean;
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

/**
 * AI Config DTOs
 */

export interface UpdateGlobalAIConfigDTO {
  model_name?: string;
  model_version?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  timeout_ms?: number;
  system_prompt?: string;
  tone?: 'professional' | 'friendly' | 'casual' | 'formal';
  language?: string;
  auto_response_enabled?: boolean;
  auto_response_delay_ms?: number;
  sentiment_analysis_enabled?: boolean;
  auto_escalation_enabled?: boolean;
  escalation_threshold?: number;
}

export interface UpdateStaffAIConfigDTO {
  model_name?: string;
  model_version?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  timeout_ms?: number;
  system_prompt?: string;
  tone?: 'professional' | 'friendly' | 'casual' | 'formal';
  language?: string;
  auto_response_enabled?: boolean;
  auto_response_delay_ms?: number;
  sentiment_analysis_enabled?: boolean;
  auto_escalation_enabled?: boolean;
  escalation_threshold?: number;
}

export interface AIConfigResponseDTO {
  id: string;
  model_name: string;
  model_version: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  timeout_ms: number;
  system_prompt: string;
  tone: string;
  language: string;
  auto_response_enabled: boolean;
  auto_response_delay_ms: number;
  sentiment_analysis_enabled: boolean;
  auto_escalation_enabled: boolean;
  escalation_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface AIConfigPresetDTO {
  id: string;
  name: string;
  description: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  timeout_ms: number;
  system_prompt: string;
  tone: string;
  language: string;
  auto_response_enabled: boolean;
  auto_response_delay_ms: number;
  sentiment_analysis_enabled: boolean;
  auto_escalation_enabled: boolean;
  escalation_threshold: number;
  is_default: boolean;
}

export interface ApplyPresetDTO {
  preset_id: string;
  staff_id?: string; // If provided, apply to staff config, else apply to global
}

export interface AIConfigAuditLogDTO {
  id: string;
  config_type: 'global' | 'staff' | 'preset';
  config_id: string;
  changed_by: string;
  action: 'create' | 'update' | 'delete';
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  reason?: string;
  created_at: string;
}
