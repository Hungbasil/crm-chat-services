import { Request, Response, NextFunction } from 'express';
import { config } from '../common/config/config';
import { AppError } from '../common/errors/AppError';
import { getLogger } from '../common/logger/Logger';

const logger = getLogger('RateLimitMiddleware');

/**
 * In-memory rate limiter store
 * For production, use Redis instead
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate Limiting Middleware
 */
export const rateLimit = (
  windowMs: number = config.rateLimit.windowMs,
  maxRequests: number = config.rateLimit.maxRequests
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (record && now < record.resetTime) {
      // Window not expired
      if (record.count >= maxRequests) {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          count: record.count,
          max: maxRequests
        });
        throw new AppError(
          429,
          'Too many requests, please try again later',
          'RATE_LIMIT_EXCEEDED'
        );
      }
      record.count++;
    } else {
      // New window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
    }

    // Clean up old entries
    if (Math.random() < 0.01) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (now >= v.resetTime) {
          rateLimitStore.delete(k);
        }
      }
    }

    next();
  };
};

/**
 * Strict rate limit for sensitive endpoints (login, register)
 * In production: 5 requests per 15 minutes
 * In development: 50 requests per 15 minutes
 */
export const strictRateLimit = rateLimit(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'production' ? 5 : 50 // 5 in prod, 50 in dev
);

/**
 * Normal rate limit for general API
 */
export const normalRateLimit = rateLimit(
  15 * 60 * 1000, // 15 minutes
  100 // 100 requests
);

/**
 * Relaxed rate limit for GET requests
 */
export const relaxedRateLimit = rateLimit(
  15 * 60 * 1000, // 15 minutes
  500 // 500 requests
);
