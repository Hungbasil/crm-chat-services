import dotenv from 'dotenv';

dotenv.config();

/**
 * Application Configuration Interface
 */
interface AppConfig {
  port: number;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    max: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  gemini: {
    apiKey: string;
    model: string;
  };
  upload: {
    uploadDir: string;
    maxFileSize: number;
    allowedMimeTypes: string[];
  };
  cors: {
    origin: string;
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

/**
 * Application Configuration
 */
export const config: AppConfig = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'omnichannel_crm_db',
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(
      process.env.DB_CONNECTION_TIMEOUT || '2000',
      10
    )
  },

  // JWT
  jwt: {
    secret: (process.env.JWT_SECRET || 'default-secret-key-change-in-production') as string,
    expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as string
  },

  // Gemini AI
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  },

  // File Upload
  upload: {
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(
      process.env.MAX_FILE_SIZE || String(5 * 1024 * 1024),
      10
    ), // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ]
  },

  // CORS
  cors: {
    origin: (process.env.CORS_ORIGIN || '*') as string,
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || String(15 * 60 * 1000), 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  }
};

/**
 * Validate required environment variables
 */
export function validateConfig(): void {
  const required = ['JWT_SECRET', 'GEMINI_API_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
