import pool from '../config/db';
import { getLogger } from '../common/logger/Logger';
import { config } from '../common/config/config';
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
  ConflictError
} from '../common/errors/AppError';
import { Validator } from '../common/config/Validator';
import {
  UpdateGlobalAIConfigDTO,
  UpdateStaffAIConfigDTO,
  ApplyPresetDTO,
  AIConfigResponseDTO,
  AIConfigPresetDTO,
  AIConfigAuditLogDTO
} from '../dto';

const logger = getLogger('AIConfigService');

/**
 * AI Configuration Service
 */
export class AIConfigService {
  /**
   * Get Global AI Config
   */
  static async getGlobalConfig(): Promise<AIConfigResponseDTO> {
    try {
      logger.debug('Fetching global AI config');

      const result = await pool.query(
        `SELECT 
          id, model_name, model_version, temperature, max_tokens, top_p, 
          timeout_ms, system_prompt, tone, language, auto_response_enabled,
          auto_response_delay_ms, sentiment_analysis_enabled, 
          auto_escalation_enabled, escalation_threshold, created_at, updated_at
         FROM ai_configs 
         ORDER BY updated_at DESC 
         LIMIT 1`
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Global AI configuration');
      }

      return result.rows[0];
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Get global config error', error);
      throw new DatabaseError('Failed to retrieve global AI config', error);
    }
  }

  /**
   * Update Global AI Config
   */
  static async updateGlobalConfig(
    dto: UpdateGlobalAIConfigDTO,
    updatedBy: string
  ): Promise<{ config: AIConfigResponseDTO; message: string }> {
    try {
      // Validate input
      if (dto.temperature !== undefined) {
        Validator.number(dto.temperature, 'Temperature', 0, 1);
      }
      if (dto.max_tokens !== undefined) {
        Validator.number(dto.max_tokens, 'Max tokens', 1);
      }
      if (dto.top_p !== undefined) {
        Validator.number(dto.top_p, 'Top P', 0, 1);
      }
      if (dto.timeout_ms !== undefined) {
        Validator.number(dto.timeout_ms, 'Timeout', 1);
      }
      if (dto.escalation_threshold !== undefined) {
        Validator.number(dto.escalation_threshold, 'Escalation threshold', 0, 1);
      }

      logger.info('Updating global AI config', { updatedBy });

      // Get current config for audit log
      const currentResult = await pool.query('SELECT * FROM ai_configs ORDER BY updated_at DESC LIMIT 1');
      const oldValues = currentResult.rows[0];

      // Build update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (dto.model_name !== undefined) {
        updates.push(`model_name = $${paramCount++}`);
        values.push(dto.model_name);
      }
      if (dto.model_version !== undefined) {
        updates.push(`model_version = $${paramCount++}`);
        values.push(dto.model_version);
      }
      if (dto.temperature !== undefined) {
        updates.push(`temperature = $${paramCount++}`);
        values.push(dto.temperature);
      }
      if (dto.max_tokens !== undefined) {
        updates.push(`max_tokens = $${paramCount++}`);
        values.push(dto.max_tokens);
      }
      if (dto.top_p !== undefined) {
        updates.push(`top_p = $${paramCount++}`);
        values.push(dto.top_p);
      }
      if (dto.timeout_ms !== undefined) {
        updates.push(`timeout_ms = $${paramCount++}`);
        values.push(dto.timeout_ms);
      }
      if (dto.system_prompt !== undefined) {
        updates.push(`system_prompt = $${paramCount++}`);
        values.push(dto.system_prompt);
      }
      if (dto.tone !== undefined) {
        updates.push(`tone = $${paramCount++}`);
        values.push(dto.tone);
      }
      if (dto.language !== undefined) {
        updates.push(`language = $${paramCount++}`);
        values.push(dto.language);
      }
      if (dto.auto_response_enabled !== undefined) {
        updates.push(`auto_response_enabled = $${paramCount++}`);
        values.push(dto.auto_response_enabled);
      }
      if (dto.auto_response_delay_ms !== undefined) {
        updates.push(`auto_response_delay_ms = $${paramCount++}`);
        values.push(dto.auto_response_delay_ms);
      }
      if (dto.sentiment_analysis_enabled !== undefined) {
        updates.push(`sentiment_analysis_enabled = $${paramCount++}`);
        values.push(dto.sentiment_analysis_enabled);
      }
      if (dto.auto_escalation_enabled !== undefined) {
        updates.push(`auto_escalation_enabled = $${paramCount++}`);
        values.push(dto.auto_escalation_enabled);
      }
      if (dto.escalation_threshold !== undefined) {
        updates.push(`escalation_threshold = $${paramCount++}`);
        values.push(dto.escalation_threshold);
      }

      updates.push(`updated_at = NOW()`);
      updates.push(`updated_by = $${paramCount++}`);
      values.push(updatedBy);

      const updateQuery = `UPDATE ai_configs SET ${updates.join(', ')} 
        WHERE id = (SELECT id FROM ai_configs ORDER BY updated_at DESC LIMIT 1)
        RETURNING id, model_name, model_version, temperature, max_tokens, top_p, 
                  timeout_ms, system_prompt, tone, language, auto_response_enabled,
                  auto_response_delay_ms, sentiment_analysis_enabled, 
                  auto_escalation_enabled, escalation_threshold, created_at, updated_at`;

      const result = await pool.query(updateQuery, values);
      const newConfig = result.rows[0];

      // Log to audit table
      await pool.query(
        `INSERT INTO ai_config_audit_logs 
         (config_type, config_id, changed_by, action, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['global', newConfig.id, updatedBy, 'update', JSON.stringify(oldValues), JSON.stringify(newConfig)]
      );

      logger.info('Global AI config updated successfully');

      return {
        config: newConfig,
        message: 'Global AI configuration updated successfully'
      };
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Update global config error', error);
      throw new DatabaseError('Failed to update global AI config', error);
    }
  }

  /**
   * Get Staff AI Config (or global if not customized)
   */
  static async getStaffConfig(staffId: string): Promise<AIConfigResponseDTO> {
    try {
      Validator.uuid(staffId, 'Staff ID');

      logger.debug('Fetching staff AI config', { staffId });

      // Try to get staff-specific config
      const staffConfigResult = await pool.query(
        `SELECT * FROM staff_ai_configs WHERE staff_id = $1`,
        [staffId]
      );

      if (staffConfigResult.rows.length > 0) {
        return staffConfigResult.rows[0];
      }

      // Fall back to global config
      return this.getGlobalConfig();
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Get staff config error', error);
      throw new DatabaseError('Failed to retrieve staff AI config', error);
    }
  }

  /**
   * Update Staff AI Config
   */
  static async updateStaffConfig(
    staffId: string,
    dto: UpdateStaffAIConfigDTO,
    updatedBy: string
  ): Promise<{ config: AIConfigResponseDTO; message: string }> {
    try {
      Validator.uuid(staffId, 'Staff ID');

      // Validate input
      if (dto.temperature !== undefined) {
        Validator.number(dto.temperature, 'Temperature', 0, 1);
      }
      if (dto.max_tokens !== undefined) {
        Validator.number(dto.max_tokens, 'Max tokens', 1);
      }
      if (dto.top_p !== undefined) {
        Validator.number(dto.top_p, 'Top P', 0, 1);
      }

      logger.info('Updating staff AI config', { staffId, updatedBy });

      // Check if staff exists
      const staffCheck = await pool.query('SELECT id FROM users WHERE id = $1', [staffId]);
      if (staffCheck.rows.length === 0) {
        throw new NotFoundError('Staff member');
      }

      // Build update query
      const updates: string[] = [];
      const values: any[] = [staffId];
      let paramCount = 2;

      if (dto.model_name !== undefined) {
        updates.push(`model_name = $${paramCount++}`);
        values.push(dto.model_name);
      }
      if (dto.temperature !== undefined) {
        updates.push(`temperature = $${paramCount++}`);
        values.push(dto.temperature);
      }
      if (dto.max_tokens !== undefined) {
        updates.push(`max_tokens = $${paramCount++}`);
        values.push(dto.max_tokens);
      }
      if (dto.top_p !== undefined) {
        updates.push(`top_p = $${paramCount++}`);
        values.push(dto.top_p);
      }
      if (dto.timeout_ms !== undefined) {
        updates.push(`timeout_ms = $${paramCount++}`);
        values.push(dto.timeout_ms);
      }
      if (dto.system_prompt !== undefined) {
        updates.push(`system_prompt = $${paramCount++}`);
        values.push(dto.system_prompt);
      }
      if (dto.tone !== undefined) {
        updates.push(`tone = $${paramCount++}`);
        values.push(dto.tone);
      }
      if (dto.language !== undefined) {
        updates.push(`language = $${paramCount++}`);
        values.push(dto.language);
      }
      if (dto.auto_response_enabled !== undefined) {
        updates.push(`auto_response_enabled = $${paramCount++}`);
        values.push(dto.auto_response_enabled);
      }
      if (dto.auto_response_delay_ms !== undefined) {
        updates.push(`auto_response_delay_ms = $${paramCount++}`);
        values.push(dto.auto_response_delay_ms);
      }
      if (dto.sentiment_analysis_enabled !== undefined) {
        updates.push(`sentiment_analysis_enabled = $${paramCount++}`);
        values.push(dto.sentiment_analysis_enabled);
      }
      if (dto.auto_escalation_enabled !== undefined) {
        updates.push(`auto_escalation_enabled = $${paramCount++}`);
        values.push(dto.auto_escalation_enabled);
      }
      if (dto.escalation_threshold !== undefined) {
        updates.push(`escalation_threshold = $${paramCount++}`);
        values.push(dto.escalation_threshold);
      }

      updates.push(`updated_at = NOW()`);
      updates.push(`updated_by = $${paramCount++}`);
      values.push(updatedBy);

      // Use UPSERT for staff config
      const upsertQuery = `
        INSERT INTO staff_ai_configs (staff_id, ${Object.keys(dto).join(', ')}, updated_by)
        VALUES ($1, ${Array.from({length: Object.keys(dto).length}, (_, i) => `$${i + 2}`).join(', ')}, $${paramCount})
        ON CONFLICT (staff_id) DO UPDATE SET ${updates.join(', ')}
        RETURNING *`;

      const result = await pool.query(upsertQuery, values);
      const updatedConfig = result.rows[0];

      logger.info('Staff AI config updated successfully', { staffId });

      return {
        config: updatedConfig,
        message: 'Staff AI configuration updated successfully'
      };
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Update staff config error', error);
      throw new DatabaseError('Failed to update staff AI config', error);
    }
  }

  /**
   * Get All AI Config Presets
   */
  static async getPresets(): Promise<AIConfigPresetDTO[]> {
    try {
      logger.debug('Fetching AI config presets');

      const result = await pool.query(
        `SELECT * FROM ai_config_presets ORDER BY is_default DESC, name ASC`
      );

      return result.rows;
    } catch (error: any) {
      logger.error('Get presets error', error);
      throw new DatabaseError('Failed to retrieve AI config presets', error);
    }
  }

  /**
   * Apply Preset to Config
   */
  static async applyPreset(
    dto: ApplyPresetDTO,
    appliedBy: string
  ): Promise<{ message: string }> {
    try {
      Validator.uuid(dto.preset_id, 'Preset ID');
      if (dto.staff_id) {
        Validator.uuid(dto.staff_id, 'Staff ID');
      }

      logger.info('Applying AI config preset', { presetId: dto.preset_id, staffId: dto.staff_id });

      // Get preset
      const presetResult = await pool.query(
        `SELECT * FROM ai_config_presets WHERE id = $1`,
        [dto.preset_id]
      );

      if (presetResult.rows.length === 0) {
        throw new NotFoundError('AI config preset');
      }

      const preset = presetResult.rows[0];

      if (dto.staff_id) {
        // Apply to staff config
        await this.updateStaffConfig(
          dto.staff_id,
          {
            temperature: preset.temperature,
            max_tokens: preset.max_tokens,
            top_p: preset.top_p,
            system_prompt: preset.system_prompt,
            tone: preset.tone,
            auto_response_enabled: preset.auto_response_enabled,
            auto_response_delay_ms: preset.auto_response_delay_ms,
            sentiment_analysis_enabled: preset.sentiment_analysis_enabled,
            auto_escalation_enabled: preset.auto_escalation_enabled,
            escalation_threshold: preset.escalation_threshold
          },
          appliedBy
        );
      } else {
        // Apply to global config
        await this.updateGlobalConfig(
          {
            temperature: preset.temperature,
            max_tokens: preset.max_tokens,
            top_p: preset.top_p,
            system_prompt: preset.system_prompt,
            tone: preset.tone,
            auto_response_enabled: preset.auto_response_enabled,
            auto_response_delay_ms: preset.auto_response_delay_ms,
            sentiment_analysis_enabled: preset.sentiment_analysis_enabled,
            auto_escalation_enabled: preset.auto_escalation_enabled,
            escalation_threshold: preset.escalation_threshold
          },
          appliedBy
        );
      }

      logger.info('Preset applied successfully');

      return {
        message: `Preset "${preset.name}" applied successfully`
      };
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Apply preset error', error);
      throw new DatabaseError('Failed to apply AI config preset', error);
    }
  }

  /**
   * Get AI Config Audit Logs
   */
  static async getAuditLogs(
    configType?: string,
    configId?: string,
    limit: number = 50
  ): Promise<AIConfigAuditLogDTO[]> {
    try {
      let query = `SELECT * FROM ai_config_audit_logs WHERE 1=1`;
      const params: any[] = [];

      if (configType) {
        query += ` AND config_type = $${params.length + 1}`;
        params.push(configType);
      }

      if (configId) {
        query += ` AND config_id = $${params.length + 1}`;
        params.push(configId);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await pool.query(query, params);

      return result.rows;
    } catch (error: any) {
      logger.error('Get audit logs error', error);
      throw new DatabaseError('Failed to retrieve AI config audit logs', error);
    }
  }

  /**
   * Reset Staff Config to Global (Delete Override)
   */
  static async resetStaffConfig(staffId: string, resetBy: string): Promise<{ message: string }> {
    try {
      Validator.uuid(staffId, 'Staff ID');

      logger.info('Resetting staff AI config to global', { staffId });

      await pool.query(
        `DELETE FROM staff_ai_configs WHERE staff_id = $1`,
        [staffId]
      );

      // Log to audit
      await pool.query(
        `INSERT INTO ai_config_audit_logs (config_type, config_id, changed_by, action)
         VALUES ($1, $2, $3, $4)`,
        ['staff', staffId, resetBy, 'delete']
      );

      logger.info('Staff config reset to global successfully', { staffId });

      return {
        message: 'Staff configuration reset to global settings'
      };
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Reset staff config error', error);
      throw new DatabaseError('Failed to reset staff AI config', error);
    }
  }
}
