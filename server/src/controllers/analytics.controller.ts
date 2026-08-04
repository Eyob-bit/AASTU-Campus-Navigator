import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "../services/analytics.service.js";
import { sendSuccess } from "../utils/response.js";

const analyticsService = new AnalyticsService();

export class AnalyticsController {
    async getOverview(req: Request, res: Response, next: NextFunction) {
        try {
            const range = req.query.range as string | undefined;
            const data = await analyticsService.getOverview(range);
            return sendSuccess(res, data, "Overview analytics retrieved successfully");
        } catch (error) {
            next(error);
        }
    }

    async getTopSearches(req: Request, res: Response, next: NextFunction) {
        try {
            const range = req.query.range as string | undefined;
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
            const data = await analyticsService.getTopSearches(range, limit);
            return sendSuccess(res, data, "Top searches retrieved successfully");
        } catch (error) {
            next(error);
        }
    }

    async getNoResults(req: Request, res: Response, next: NextFunction) {
        try {
            const range = req.query.range as string | undefined;
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
            const data = await analyticsService.getNoResults(range, limit);
            return sendSuccess(res, data, "No-result queries retrieved successfully");
        } catch (error) {
            next(error);
        }
    }

    async getSearchTrend(req: Request, res: Response, next: NextFunction) {
        try {
            const range = req.query.range as string | undefined;
            const data = await analyticsService.getSearchTrend(range);
            return sendSuccess(res, data, "Search trend analytics retrieved successfully");
        } catch (error) {
            next(error);
        }
    }

    async getNavigationStats(req: Request, res: Response, next: NextFunction) {
        try {
            const range = req.query.range as string | undefined;
            const data = await analyticsService.getNavigationStats(range);
            return sendSuccess(res, data, "Navigation stats retrieved successfully");
        } catch (error) {
            next(error);
        }
    }

    async getPopularBuildings(req: Request, res: Response, next: NextFunction) {
        try {
            const range = req.query.range as string | undefined;
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
            const data = await analyticsService.getPopularBuildings(range, limit);
            return sendSuccess(res, data, "Popular buildings retrieved successfully");
        } catch (error) {
            next(error);
        }
    }

    async getChatAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const range = req.query.range as string | undefined;
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
            const data = await analyticsService.getChatAnalytics(range, limit);
            return sendSuccess(res, data, "AI Chat analytics retrieved successfully");
        } catch (error) {
            next(error);
        }
    }
}

export const analyticsController = new AnalyticsController();

