import { Router } from 'express';
import {
  getGlobalConfig,
  updateGlobalConfig,
  getStaffConfig,
  updateStaffConfig,
  getPresets,
  applyPreset,
  getAuditLogs,
  resetStaffConfig
} from '../Controllers/aiConfig';
import { authenticate, isAdmin } from '../Middleware/auth';
import { validateBody, validateParams } from '../Middleware/validation';
import { relaxedRateLimit } from '../Middleware/rateLimit';

const router = Router();

// [GET] Global AI Config (everyone)
router.get('/config/global', authenticate, relaxedRateLimit, getGlobalConfig);

// [PUT] Update Global AI Config (Admin only)
router.put('/config/global', authenticate, isAdmin, relaxedRateLimit, updateGlobalConfig);

// [GET] Staff AI Config (everyone)
router.get('/config/staff/:staffId', authenticate, relaxedRateLimit, validateParams(['staffId']), getStaffConfig);

// [PUT] Update Staff AI Config (Admin only, or staff for themselves)
router.put('/config/staff/:staffId', authenticate, relaxedRateLimit, validateParams(['staffId']), updateStaffConfig);

// [GET] AI Config Presets (everyone)
router.get('/presets', authenticate, relaxedRateLimit, getPresets);

// [POST] Apply Preset (Admin only)
router.post('/presets/apply', authenticate, isAdmin, relaxedRateLimit, validateBody(['preset_id']), applyPreset);

// [GET] Audit Logs (Admin only)
router.get('/audit-logs', authenticate, isAdmin, relaxedRateLimit, getAuditLogs);

// [DELETE] Reset Staff Config to Global (Admin only)
router.delete('/config/staff/:staffId', authenticate, isAdmin, relaxedRateLimit, validateParams(['staffId']), resetStaffConfig);

export default router;
