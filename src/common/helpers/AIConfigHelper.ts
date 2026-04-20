import pool from '../../config/db';
import { getLogger } from '../logger/Logger';
import { AIConfigResponseDTO } from '../../dto';

const logger = getLogger('AIConfigHelper');

/**
 * Helper để load AI config (per-staff hoặc global)
 */
export class AIConfigHelper {
  /**
   * Load AI config cho staff (per-staff nếu có, nếu không dùng global)
   */
  static async loadConfigForStaff(staffId?: string): Promise<AIConfigResponseDTO> {
    try {
      // Nếu có staffId, thử load per-staff config
      if (staffId) {
        const staffConfigResult = await pool.query(
          `SELECT 
            COALESCE(sac.id, ac.id) as id,
            COALESCE(sac.model_name, ac.model_name) as model_name,
            COALESCE(sac.model_version, ac.model_version) as model_version,
            COALESCE(sac.temperature, ac.temperature) as temperature,
            COALESCE(sac.max_tokens, ac.max_tokens) as max_tokens,
            COALESCE(sac.top_p, ac.top_p) as top_p,
            COALESCE(sac.timeout_ms, ac.timeout_ms) as timeout_ms,
            COALESCE(sac.system_prompt, ac.system_prompt) as system_prompt,
            COALESCE(sac.tone, ac.tone) as tone,
            COALESCE(sac.language, ac.language) as language,
            COALESCE(sac.auto_response_enabled, ac.auto_response_enabled) as auto_response_enabled,
            COALESCE(sac.auto_response_delay_ms, ac.auto_response_delay_ms) as auto_response_delay_ms,
            COALESCE(sac.sentiment_analysis_enabled, ac.sentiment_analysis_enabled) as sentiment_analysis_enabled,
            COALESCE(sac.auto_escalation_enabled, ac.auto_escalation_enabled) as auto_escalation_enabled,
            COALESCE(sac.escalation_threshold, ac.escalation_threshold) as escalation_threshold,
            COALESCE(sac.created_at, ac.created_at) as created_at,
            COALESCE(sac.updated_at, ac.updated_at) as updated_at
           FROM ai_configs ac
           LEFT JOIN staff_ai_configs sac ON sac.staff_id = $1
           ORDER BY ac.updated_at DESC LIMIT 1`,
          [staffId]
        );

        if (staffConfigResult.rows.length > 0) {
          logger.debug('Loaded staff AI config', { staffId });
          return staffConfigResult.rows[0];
        }
      }

      // Fall back to global config
      const globalConfigResult = await pool.query(
        `SELECT 
          id, model_name, model_version, temperature, max_tokens, top_p, 
          timeout_ms, system_prompt, tone, language, auto_response_enabled,
          auto_response_delay_ms, sentiment_analysis_enabled, 
          auto_escalation_enabled, escalation_threshold, created_at, updated_at
         FROM ai_configs 
         ORDER BY updated_at DESC LIMIT 1`
      );

      if (globalConfigResult.rows.length > 0) {
        logger.debug('Loaded global AI config');
        return globalConfigResult.rows[0];
      }

      // Default fallback (shouldn't reach here if migration ran)
      logger.warn('No AI config found, using hardcoded defaults');
      return {
        id: 'default',
        model_name: 'gemini',
        model_version: 'gemini-2.5-flash',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        timeout_ms: 30000,
        system_prompt: 'Bạn là một hỗ trợ khách hàng chuyên nghiệp.',
        tone: 'professional',
        language: 'vi',
        auto_response_enabled: false,
        auto_response_delay_ms: 5000,
        sentiment_analysis_enabled: true,
        auto_escalation_enabled: true,
        escalation_threshold: 0.3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error: any) {
      logger.error('Error loading AI config', error);
      // Return default config on error
      return {
        id: 'default',
        model_name: 'gemini',
        model_version: 'gemini-2.5-flash',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        timeout_ms: 30000,
        system_prompt: 'Bạn là một hỗ trợ khách hàng chuyên nghiệp.',
        tone: 'professional',
        language: 'vi',
        auto_response_enabled: false,
        auto_response_delay_ms: 5000,
        sentiment_analysis_enabled: true,
        auto_escalation_enabled: true,
        escalation_threshold: 0.3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  /**
   * Format system prompt based on tone and language
   */
  static formatSystemPrompt(
    customPrompt: string,
    tone: string,
    language: string
  ): string {
    const toneDescriptions: Record<string, Record<string, string>> = {
      professional: {
        vi: 'Hãy trả lời một cách chuyên nghiệp, lịch sự và chính xác.',
        en: 'Please respond professionally, courteously, and accurately.'
      },
      friendly: {
        vi: 'Hãy trả lời một cách thân thiện, chu đáo và nhiệt tình.',
        en: 'Please respond in a friendly, caring, and enthusiastic manner.'
      },
      casual: {
        vi: 'Hãy trả lời một cách thoải mái, tự nhiên và gần gũi.',
        en: 'Please respond in a casual, natural, and approachable way.'
      },
      formal: {
        vi: 'Hãy trả lời một cách trang trọng, chính thức và chu đáo.',
        en: 'Please respond formally, officially, and meticulously.'
      }
    };

    const toneGuide = toneDescriptions[tone]?.[language] || toneDescriptions.professional.vi;
    return `${customPrompt}\n\n${toneGuide}`;
  }
}
