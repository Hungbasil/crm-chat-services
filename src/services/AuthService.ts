import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { getLogger } from '../common/logger/Logger';
import { config } from '../common/config/config';
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
  NotFoundError,
  DatabaseError
} from '../common/errors/AppError';
import { Validator } from '../common/config/Validator';
import {
  RegisterRequestDTO,
  LoginRequestDTO,
  UpdateUserRoleDTO
} from '../dto';

const logger = getLogger('AuthService');

/**
 * Authentication Service
 */
export class AuthService {
  /**
   * Register user
   */
  static async register(dto: RegisterRequestDTO) {
    try {
      // Validate input
      Validator.requiredString(dto.email, 'Email');
      Validator.email(dto.email);
      Validator.password(dto.password);
      Validator.requiredString(dto.full_name, 'Full name', 2);

      logger.info('Registering user', { email: dto.email });

      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [dto.email]
      );

      if (existingUser.rows.length > 0) {
        logger.warn('Registration failed - email already exists', {
          email: dto.email
        });
        throw new ConflictError('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Insert user
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, role, created_at',
        [dto.email, hashedPassword, dto.full_name]
      );

      const user = result.rows[0];
      logger.info('User registered successfully', { userId: user.id });

      return {
        message: 'Registration successful',
        user
      };
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error;
      }
      logger.error('Registration error', error);
      throw new DatabaseError('Failed to register user', error);
    }
  }

  /**
   * Login user
   */
  static async login(dto: LoginRequestDTO) {
    try {
      // Validate input
      Validator.requiredString(dto.email, 'Email');
      Validator.requiredString(dto.password, 'Password');

      logger.info('User login attempt', { email: dto.email });

      // Find user
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [dto.email]
      );

      if (result.rows.length === 0) {
        logger.warn('Login failed - user not found', { email: dto.email });
        throw new AuthenticationError('Invalid email or password');
      }

      const user = result.rows[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        dto.password,
        user.password_hash
      );

      if (!isPasswordValid) {
        logger.warn('Login failed - invalid password', { email: dto.email });
        throw new AuthenticationError('Invalid email or password');
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn as any }
      );

      logger.info('User login successful', { userId: user.id });

      return {
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      };
    } catch (error: any) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      logger.error('Login error', error);
      throw new DatabaseError('Login failed', error);
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(userId: string) {
    try {
      Validator.uuid(userId, 'User ID');

      logger.debug('Fetching user profile', { userId });

      const result = await pool.query(
        'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('User');
      }

      return {
        message: 'Profile retrieved successfully',
        user: result.rows[0]
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Get profile error', error);
      throw new DatabaseError('Failed to retrieve profile', error);
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, dto: UpdateUserRoleDTO) {
    try {
      Validator.uuid(userId, 'User ID');
      Validator.enum(dto.role, ['ADMIN', 'STAFF', 'AGENT'], 'Role');

      logger.info('Updating user role', { userId, newRole: dto.role });

      const result = await pool.query(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, full_name, role',
        [dto.role, userId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('User');
      }

      logger.info('User role updated successfully', {
        userId,
        newRole: dto.role
      });

      return {
        message: `Role updated to ${dto.role} successfully`,
        user: result.rows[0]
      };
    } catch (error: any) {
      if (
        error instanceof ValidationError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }
      logger.error('Update role error', error);
      throw new DatabaseError('Failed to update role', error);
    }
  }
}
