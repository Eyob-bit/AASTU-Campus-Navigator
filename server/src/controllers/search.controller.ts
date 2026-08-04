import { Request, Response, NextFunction } from "express";
import { searchSchema } from "../validators/search.validator.js";
import { SearchService } from "../services/search.service.js";
import { sendSuccess } from "../utils/response.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/prisma.js";

const searchService = new SearchService();

export class SearchController {
    async search(req: Request, res: Response, next: NextFunction) {
        const { q } = req.query;
        const queryStr = typeof q === "string" ? q.trim() : "";

        try {
            const result = searchSchema.safeParse(req.query);

            if (!result.success) {
                throw new ApiError(400, result.error.issues[0].message);
            }

            const searchResult = await searchService.search(result.data.q);

            // Log successful search asynchronously
            if (queryStr) {
                prisma.searchLog.create({
                    data: {
                        query: queryStr,
                        resultCount: Array.isArray(searchResult) ? searchResult.length : 1,
                        hasResults: true,
                    },
                }).catch(() => {});
            }

            return sendSuccess(res, searchResult, "Search completed successfully.");
        } catch (error) {
            // Log failed / zero-result search asynchronously
            if (queryStr) {
                prisma.searchLog.create({
                    data: {
                        query: queryStr,
                        resultCount: 0,
                        hasResults: false,
                    },
                }).catch(() => {});
            }

            next(error);
        }
    }

    async searchLandmarks(req: Request, res: Response, next: NextFunction) {
        try {
            const q = (req.query.q as string) ?? "";
            if (!q.trim()) {
                throw new ApiError(400, "Search query must not be empty");
            }
            const results = await searchService.searchLandmarks(q);
            return sendSuccess(res, results, "Landmark search completed");
        } catch (error) {
            next(error);
        }
    }
}

export const searchController = new SearchController();

