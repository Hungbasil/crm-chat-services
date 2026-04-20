import { Request, Response } from 'express';
import { ResponseHandler } from '../common/response/ResponseHandler';
import { asyncHandler } from '../Middleware/errorHandler';
import { AIConfigService } from '../services/AIConfigService';
import {
  UpdateGlobalAIConfigDTO,
  UpdateStaffAIConfigDTO,
  ApplyPresetDTO
} from '../dto';

/**
 * [GET] Global AI Config
 */
export const getGlobalConfig = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await AIConfigService.getGlobalConfig();
    ResponseHandler.success(res, result, 'Global AI configuration retrieved successfully');
  }
);

/**
 * [PUT] Update Global AI Config (Admin only)
 */
export const updateGlobalConfig = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const dto: UpdateGlobalAIConfigDTO = req.body;
    const userId = req.userId!;

    const result = await AIConfigService.updateGlobalConfig(dto, userId);
    ResponseHandler.success(res, result.config, result.message);
  }
);

/**
 * [GET] Staff AI Config (by staffId)
 */
export const getStaffConfig = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const staffId = Array.isArray(req.params.staffId)
      ? req.params.staffId[0]
      : req.params.staffId;

    const result = await AIConfigService.getStaffConfig(staffId);
    ResponseHandler.success(res, result, 'Staff AI configuration retrieved successfully');
  }
);

/**
 * [PUT] Update Staff AI Config (Admin only, or staff for themselves)
 */
export const updateStaffConfig = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const staffId = Array.isArray(req.params.staffId)
      ? req.params.staffId[0]
      : req.params.staffId;
    const dto: UpdateStaffAIConfigDTO = req.body;
    const userId = req.userId!;

    const result = await AIConfigService.updateStaffConfig(staffId, dto, userId);
    ResponseHandler.success(res, result.config, result.message);
  }
);

/**
 * [GET] AI Config Presets
 */
export const getPresets = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await AIConfigService.getPresets();
    ResponseHandler.success(res, result, 'AI configuration presets retrieved successfully');
  }
);

/**
 * [POST] Apply Preset to Config
 */
export const applyPreset = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const dto: ApplyPresetDTO = req.body;
    const userId = req.userId!;

    const result = await AIConfigService.applyPreset(dto, userId);
    ResponseHandler.success(res, {}, result.message);
  }
);

/**
 * [GET] AI Config Audit Logs
 */
export const getAuditLogs = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    let configType: string | undefined;
    if (Array.isArray(req.query.type)) {
      configType = req.query.type[0] as string | undefined;
    } else if (typeof req.query.type === 'string') {
      configType = req.query.type;
    }

    let configId: string | undefined;
    if (Array.isArray(req.query.id)) {
      configId = req.query.id[0] as string | undefined;
    } else if (typeof req.query.id === 'string') {
      configId = req.query.id;
    }

    let limitValue = 50;
    if (Array.isArray(req.query.limit)) {
      const limitStr = req.query.limit[0];
      if (typeof limitStr === 'string') {
        limitValue = parseInt(limitStr, 10) || 50;
      }
    } else if (typeof req.query.limit === 'string') {
      limitValue = parseInt(req.query.limit, 10) || 50;
    }

    const result = await AIConfigService.getAuditLogs(configType, configId, limitValue);
    ResponseHandler.success(res, result, 'AI configuration audit logs retrieved successfully');
  }
);

/**
 * [DELETE] Reset Staff Config to Global
 */
export const resetStaffConfig = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const staffId = Array.isArray(req.params.staffId)
      ? req.params.staffId[0]
      : req.params.staffId;
    const userId = req.userId!;

    const result = await AIConfigService.resetStaffConfig(staffId, userId);
    ResponseHandler.success(res, {}, result.message);
  }
);
