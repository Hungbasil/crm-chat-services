import { Request, Response } from 'express';
import { ResponseHandler } from '../common/response/ResponseHandler';
import { asyncHandler } from '../Middleware/errorHandler';
import { DashboardService } from '../services/DashboardService';

/**
 * [GET] Get Dashboard Statistics
 */
export const getStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const stats = await DashboardService.getDashboardStats();
    ResponseHandler.success(res, stats, 'Dashboard statistics retrieved successfully');
  }
);

/**
 * [GET] Get Online Staff Count
 */
export const getOnlineStaffCount = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const count = await DashboardService.getOnlineStaffCount();
    ResponseHandler.success(res, { count }, 'Online staff count retrieved successfully');
  }
);

/**
 * [GET] Get Active Chats Count
 */
export const getActiveChatsCount = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const count = await DashboardService.getActiveChatsCount();
    ResponseHandler.success(res, { count }, 'Active chats count retrieved successfully');
  }
);

/**
 * [GET] Get Satisfaction Rate
 */
export const getSatisfactionRate = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const rate = await DashboardService.calculateSatisfactionRate();
    ResponseHandler.success(res, { rate }, 'Satisfaction rate retrieved successfully');
  }
);

/**
 * [GET] Get Sentiment Analysis
 */
export const getSentimentAnalysis = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = await DashboardService.getSentimentAnalysis();
    ResponseHandler.success(res, data, 'Sentiment analysis retrieved successfully');
  }
);

/**
 * [GET] Get Channel Statistics
 */
export const getChannelStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = await DashboardService.getChannelStats();
    ResponseHandler.success(res, data, 'Channel statistics retrieved successfully');
  }
);
