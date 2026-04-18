import { Request, Response, NextFunction } from 'express';
import { getLogger } from '../common/logger/Logger';

const logger = getLogger('RequestLogger');

/**
 * Request Logging Middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log incoming request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Intercept response
  const originalSend = res.send;

  res.send = function (data: any) {
    const duration = Date.now() - startTime;

    // Log outgoing response
    logger.info('Outgoing response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};
