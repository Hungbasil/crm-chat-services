import { Request, Response } from 'express';
import { ResponseHandler } from '../common/response/ResponseHandler';
import { asyncHandler } from '../Middleware/errorHandler';
import { AuthService } from '../services/AuthService';
import {
  RegisterRequestDTO,
  LoginRequestDTO,
  UpdateUserRoleDTO
} from '../dto';

/**
 * [POST] Register
 */
export const register = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const dto: RegisterRequestDTO = req.body;
    const result = await AuthService.register(dto);
    ResponseHandler.created(res, result.user, result.message);
  }
);

/**
 * [POST] Login
 */
export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const dto: LoginRequestDTO = req.body;
    const result = await AuthService.login(dto);
    ResponseHandler.success(res, {
      token: result.token,
      user: result.user
    }, result.message);
  }
);

/**
 * [GET] Profile
 */
export const getProfile = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const result = await AuthService.getProfile(userId);
    ResponseHandler.success(res, result.user, result.message);
  }
);

/**
 * [PUT] Update User Role
 */
export const updateUserRole = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const dto: UpdateUserRoleDTO = req.body;
    const result = await AuthService.updateUserRole(userId, dto);
    ResponseHandler.success(res, result.user, result.message);
  }
);