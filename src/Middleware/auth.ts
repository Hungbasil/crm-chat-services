import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../common/config/config';
import {
  AuthenticationError,
  AuthorizationError
} from '../common/errors/AppError';
import { getLogger } from '../common/logger/Logger';

const logger = getLogger('AuthMiddleware');

// Extend Express Request type untuk thêm user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

/**
 * JWT Authentication Middleware
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn('Missing token', { path: req.path });
      return next(new AuthenticationError('Token not found'));
    }

    const decoded: any = jwt.verify(token, config.jwt.secret);
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    logger.debug('User authenticated', { userId: req.userId });
    next();
  } catch (error: any) {
    logger.warn('Authentication failed', error);
    next(new AuthenticationError('Invalid or expired token'));
  }
};

/**
 * Admin Authorization Middleware
 */
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.userRole !== 'ADMIN') {
    logger.warn('Unauthorized access - admin required', {
      userId: req.userId,
      userRole: req.userRole,
      path: req.path
    });
    return next(new AuthorizationError('Admin access required'));
  }
  next();
};

/**
 * Staff or Admin Authorization Middleware
 */
export const isAdminOrStaff = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.userRole !== 'ADMIN' && req.userRole !== 'STAFF') {
    logger.warn('Unauthorized access - admin or staff required', {
      userId: req.userId,
      userRole: req.userRole,
      path: req.path
    });
    return next(new AuthorizationError('Admin or staff access required'));
  }
  next();
};

/**
 * Socket.io Authentication Middleware
 */
export const socketAuthWithRole = (socket: any, next: any) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    logger.warn('Socket connection - missing token', { socketId: socket.id });
    return next(new AuthenticationError('Token not found'));
  }

  jwt.verify(token, config.jwt.secret, (err: any, decoded: any) => {
    if (err) {
      logger.warn('Socket connection - invalid token', {
        socketId: socket.id,
        error: err.message
      });
      return next(new AuthenticationError('Invalid or expired token'));
    }
    socket.user = {
      userId: decoded.userId,
      role: decoded.role
    };
    logger.debug('Socket authenticated', { socketId: socket.id });
    next();
  });
};
