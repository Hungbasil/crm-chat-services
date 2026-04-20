/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Validation Error - 400
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication Error - 401
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, message, 'AUTHENTICATION_ERROR');
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization Error - 403
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, message, 'AUTHORIZATION_ERROR');
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not Found Error - 404
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND_ERROR');
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict Error - 409
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT_ERROR');
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Business Logic Error - 422
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, details?: any) {
    super(422, message, 'BUSINESS_LOGIC_ERROR', details);
    Object.setPrototypeOf(this, BusinessLogicError.prototype);
  }
}

/**
 * Internal Server Error - 500
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(500, message, 'INTERNAL_SERVER_ERROR', details);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Database Error - 500
 */
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: any) {
    super(500, message, 'DATABASE_ERROR', originalError?.message);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * File Upload Error - 400/500
 */
export class FileUploadError extends AppError {
  constructor(message: string, statusCode: number = 400) {
    super(statusCode, message, 'FILE_UPLOAD_ERROR');
    Object.setPrototypeOf(this, FileUploadError.prototype);
  }
}

/**
 * Check if error is AppError
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}
