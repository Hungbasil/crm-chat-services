import { ValidationError } from '../errors/AppError';

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validation utilities
 */
export class Validator {
  /**
   * Validate email
   */
  static email(email: string): void {
    if (!email || !EMAIL_REGEX.test(email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  /**
   * Validate password
   */
  static password(password: string, minLength: number = 6): void {
    if (!password || password.length < minLength) {
      throw new ValidationError(
        `Password must be at least ${minLength} characters long`
      );
    }
  }

  /**
   * Validate required string
   */
  static requiredString(
    value: any,
    fieldName: string,
    minLength?: number,
    maxLength?: number
  ): void {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new ValidationError(`${fieldName} is required`);
    }

    if (minLength && value.length < minLength) {
      throw new ValidationError(
        `${fieldName} must be at least ${minLength} characters long`
      );
    }

    if (maxLength && value.length > maxLength) {
      throw new ValidationError(
        `${fieldName} must not exceed ${maxLength} characters`
      );
    }
  }

  /**
   * Validate required UUID
   */
  static uuid(value: any, fieldName: string = 'ID'): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!value || !uuidRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid UUID`);
    }
  }

  /**
   * Validate enum value
   */
  static enum(
    value: any,
    enumValues: string[],
    fieldName: string
  ): void {
    if (!enumValues.includes(value)) {
      throw new ValidationError(
        `${fieldName} must be one of: ${enumValues.join(', ')}`
      );
    }
  }

  /**
   * Validate object shape
   */
  static object(value: any, fieldName: string = 'value'): void {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an object`);
    }
  }

  /**
   * Validate file MIME type
   */
  static fileMimeType(
    mimeType: string,
    allowedTypes: string[]
  ): void {
    if (!allowedTypes.includes(mimeType)) {
      throw new ValidationError(
        `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      );
    }
  }

  /**
   * Validate file size
   */
  static fileSize(fileSize: number, maxSize: number): void {
    if (fileSize > maxSize) {
      throw new ValidationError(
        `File size exceeds maximum allowed (${maxSize / (1024 * 1024)}MB)`
      );
    }
  }
}
