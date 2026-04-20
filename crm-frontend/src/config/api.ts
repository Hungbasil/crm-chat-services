/**
 * API Configuration
 * Centralized API base URL and endpoints
 */

// Get API base URL from environment or use default
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    ACTIVITY: `${API_BASE_URL}/api/auth/activity`,
    PROFILE: `${API_BASE_URL}/api/auth/profile`,
    STAFF_LIST: `${API_BASE_URL}/api/auth/staff`,
    STAFF_BY_ID: (staffId: string) => `${API_BASE_URL}/api/auth/staff/${staffId}`,
    UPDATE_STAFF_ROLE: (staffId: string) => `${API_BASE_URL}/api/auth/users/${staffId}/role`,
    DELETE_STAFF: (staffId: string) => `${API_BASE_URL}/api/auth/staff/${staffId}`,
  },

  // Chat endpoints
  CHAT: {
    LIST: `${API_BASE_URL}/api/chat/list`,
    CONVERSATIONS: `${API_BASE_URL}/api/chat/conversations`,
    MESSAGES: (conversationId: string) => `${API_BASE_URL}/api/chat/${conversationId}`,
    MESSAGE_BY_ID: (messageId: string) => `${API_BASE_URL}/api/chat/message/${messageId}`,
  },

  // File upload endpoints
  FILES: {
    UPLOAD_IMAGE: `${API_BASE_URL}/api/files/upload-image`,
  },

  // Dashboard endpoints
  DASHBOARD: {
    STATS: `${API_BASE_URL}/api/dashboard/stats`,
    ONLINE_STAFF: `${API_BASE_URL}/api/dashboard/online-staff`,
    ACTIVE_CHATS: `${API_BASE_URL}/api/dashboard/active-chats`,
    SATISFACTION_RATE: `${API_BASE_URL}/api/dashboard/satisfaction-rate`,
  },
};

export default API_ENDPOINTS;
