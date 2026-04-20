import { Request, Response, NextFunction } from 'express';
import { AppError, isAppError } from '../common/errors/AppError';
import { ResponseHandler } from '../common/response/ResponseHandler';
import { getLogger } from '../common/logger/Logger';

const logger = getLogger('ErrorHandler');

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  if (isAppError(error)) {
    logger.warn(`${error.code}: ${error.message}`, {
      statusCode: error.statusCode,
      path: req.path,
      method: req.method
    });
  } else {
    logger.error(`Unhandled error: ${error.message}`, error, {
      path: req.path,
      method: req.method
    });
  }

  // Send response
  ResponseHandler.error(res, error);
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    404,
    `Cannot ${req.method} ${req.path}`,
    'NOT_FOUND'
  );
  ResponseHandler.error(res, error);
};
