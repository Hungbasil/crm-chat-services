import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { getLogger } from '../common/logger/Logger';

const logger = getLogger('ActivityTracker');

/**
 * Middleware to track user activity
 * Updates last_activity timestamp when authenticated users make requests
 */
export const activityTracker = async (
  req: Request & { userId?: string },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Only track if user is authenticated
    if (req.userId) {
      // Update activity asynchronously without blocking the request
      AuthService.updateLastActivity(req.userId).catch((error) => {
        logger.debug('Failed to update activity', { error, userId: req.userId });
      });
    }
  } catch (error) {
    logger.error('Activity tracker error', error);
  }

  next();
};
