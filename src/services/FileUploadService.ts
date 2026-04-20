import pool from '../config/db';
import { getLogger } from '../common/logger/Logger';
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
  FileUploadError
} from '../common/errors/AppError';
import { Validator } from '../common/config/Validator';
import { config } from '../common/config/config';
import { FileUploadRequestDTO } from '../dto';

const logger = getLogger('FileUploadService');

/**
 * File Upload Service
 */
export class FileUploadService {
  /**
   * Save uploaded image to database
   */
  static async saveImage(
    file: Express.Multer.File,
    dto: FileUploadRequestDTO
  ) {
    try {
      // Validate input
      Validator.uuid(dto.conversation_id, 'Conversation ID');
      Validator.enum(
        dto.sender_type,
        ['CUSTOMER', 'STAFF'],
        'Sender type'
      );

      if (!file) {
        throw new FileUploadError('No file provided');
      }

      // Validate file
      Validator.fileMimeType(file.mimetype, config.upload.allowedMimeTypes);
      Validator.fileSize(file.size, config.upload.maxFileSize);

      logger.info('Uploading image', {
        conversationId: dto.conversation_id,
        fileName: file.filename,
        fileSize: file.size
      });

      // Create image URL
      const imageUrl = `/uploads/${file.filename}`;

      // Save to database
      const result = await pool.query(
        'INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, $2, $3) RETURNING id, conversation_id, sender_type, content, created_at',
        [dto.conversation_id, dto.sender_type, imageUrl]
      );

      const message = result.rows[0];

      logger.info('Image uploaded successfully', {
        messageId: message.id,
        conversationId: dto.conversation_id
      });

      return {
        message: 'Image uploaded successfully',
        data: {
          id: message.id,
          conversation_id: message.conversation_id,
          sender_type: message.sender_type,
          content: message.content,
          file: {
            filename: file.filename,
            originalname: file.originalname,
            size: file.size,
            url: imageUrl
          },
          created_at: message.created_at
        }
      };
    } catch (error: any) {
      if (
        error instanceof ValidationError ||
        error instanceof FileUploadError
      ) {
        throw error;
      }
      logger.error('Image upload error', error);
      throw new DatabaseError('Failed to save image', error);
    }
  }

  /**
   * Delete image file
   */
  static async deleteImage(messageId: string) {
    try {
      Validator.uuid(messageId, 'Message ID');

      logger.info('Deleting image', { messageId });

      // Get message
      const result = await pool.query(
        'SELECT content FROM messages WHERE id = $1',
        [messageId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Message');
      }

      const message = result.rows[0];

      // Delete from database
      await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);

      logger.info('Image deleted successfully', { messageId });

      return {
        message: 'Image deleted successfully'
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Image deletion error', error);
      throw new DatabaseError('Failed to delete image', error);
    }
  }
}
