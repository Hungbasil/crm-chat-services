import { Router } from 'express';
import { uploadImage } from '../Controllers/fileUpload';
import { upload } from '../Middleware/upload';
import { authenticate } from '../Middleware/auth';
import { validateBody } from '../Middleware/validation';
import { normalRateLimit } from '../Middleware/rateLimit';

const router = Router();

// [POST] Upload image
router.post(
  '/upload-image',
  authenticate,
  normalRateLimit,
  upload.single('file'),
  validateBody(['conversation_id', 'sender_type']),
  uploadImage
);

export default router;
