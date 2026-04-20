import { Response } from 'express';
import { AppError } from '../errors/AppError';

/**
 * Standard API Response Type
 */
export interface ApiResponse<T = any> {
  success: boolean;
  code: string;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Response Handler - Standardize all API responses
 */
export class ResponseHandler {
  /**
   * Send success response
   */
  static success<T = any>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      code: 'SUCCESS',
      message,
      data,
      timestamp: new Date().toISOString()
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    error: AppError | Error,
    message?: string
  ): Response {
    if (error instanceof AppError) {
      const response: ApiResponse = {
        success: false,
        code: error.code,
        message: error.message,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        },
        timestamp: new Date().toISOString()
      };
      return res.status(error.statusCode).json(response);
    }

    // Generic error (not AppError)
    const response: ApiResponse = {
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: message || error.message || 'An unexpected error occurred',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }

  /**
   * Send created response (201)
   */
  static created<T = any>(
    res: Response,
    data: T,
    message: string = 'Created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  /**
   * Send no content response (204)
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Send paginated response
   */
  static paginated<T = any>(
    res: Response,
    items: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Success'
  ): Response {
    const totalPages = Math.ceil(total / limit);
    const response: ApiResponse<{ items: T[]; pagination: any }> = {
      success: true,
      code: 'SUCCESS',
      message,
      data: {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      },
      timestamp: new Date().toISOString()
    };
    return res.status(200).json(response);
  }
}
