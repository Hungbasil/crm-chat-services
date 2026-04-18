import { Request, Response } from 'express';
import { ResponseHandler } from '../common/response/ResponseHandler';
import { asyncHandler } from '../Middleware/errorHandler';
import { FileUploadService } from '../services/FileUploadService';
import { FileUploadRequestDTO } from '../dto';

interface FileRequest extends Request {
  file?: Express.Multer.File;
}

/**
 * [POST] Upload Image
 */
export const uploadImage = asyncHandler(
  async (req: FileRequest, res: Response): Promise<void> => {
    const dto: FileUploadRequestDTO = req.body;
    const file = req.file;

    if (!file) {
      throw new Error('No file uploaded');
    }

    const result = await FileUploadService.saveImage(file, dto);
    ResponseHandler.created(res, result.data, result.message);
  }
);
