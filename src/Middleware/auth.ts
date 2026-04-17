import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type để thêm user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

// Middleware xác thực JWT
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || '';

    if (!token) {
      res.status(401).json({ error: 'Token không tìm thấy' });
      return;
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token không hợp lệ hoặc hết hạn' });
  }
};

// Middleware phân quyền - chỉ ADMIN
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.userRole !== 'ADMIN') {
    res.status(403).json({ error: 'Bạn không có quyền truy cập (cần quyền ADMIN)' });
    return;
  }
  next();
};

// Middleware phân quyền - ADMIN hoặc STAFF
export const isAdminOrStaff = (req: Request, res: Response, next: NextFunction): void => {
  if (req.userRole !== 'ADMIN' && req.userRole !== 'STAFF') {
    res.status(403).json({ error: 'Bạn không có quyền truy cập (cần quyền ADMIN hoặc STAFF)' });
    return;
  }
  next();
};

// Middleware để kiểm tra Socket.io auth với role
export const socketAuthWithRole = (socket: any, next: any) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: Không tìm thấy Token'));
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
    if (err) {
      return next(new Error('Authentication error: Token không hợp lệ hoặc đã hết hạn'));
    }
    socket.user = {
      userId: decoded.userId,
      role: decoded.role
    };
    next();
  });
};
