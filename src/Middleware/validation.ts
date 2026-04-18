import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../common/errors/AppError';
import { getLogger } from '../common/logger/Logger';

const logger = getLogger('ValidationMiddleware');

/**
 * Request Body Validation Middleware
 */
export const validateBody =
  (requiredFields: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const missingFields = requiredFields.filter((field) => !req.body?.[field]);

    if (missingFields.length > 0) {
      logger.warn('Validation failed - missing fields', {
        missingFields,
        path: req.path
      });
      return next(new ValidationError(`Missing required fields: ${missingFields.join(', ')}`));
    }

    next();
  };

/**
 * Request Query Validation Middleware
 */
export const validateQuery =
  (requiredFields: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const missingFields = requiredFields.filter((field) => !req.query?.[field]);

    if (missingFields.length > 0) {
      logger.warn('Validation failed - missing query params', {
        missingFields,
        path: req.path
      });
      return next(new ValidationError(`Missing required query parameters: ${missingFields.join(', ')}`));
    }

    next();
  };

/**
 * Request Params Validation Middleware
 */
export const validateParams =
  (requiredFields: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const missingFields = requiredFields.filter((field) => !req.params?.[field]);

    if (missingFields.length > 0) {
      logger.warn('Validation failed - missing path params', {
        missingFields,
        path: req.path
      });
      return next(new ValidationError(`Missing required path parameters: ${missingFields.join(', ')}`));
    }

    next();
  };
