import { Request, Response, NextFunction } from "express";
import { searchSchema } from "../validators/search.validator.js";
import { SearchService } from "../services/search.service.js";
import { sendSuccess } from "../utils/response.js";
import { ApiError } from "../utils/ApiError.js";

const searchService = new SearchService();

export class SearchController {
    async search(req: Request, res: Response, next: NextFunction) {
        try {
            const result = searchSchema.safeParse(req.query);

            if (!result.success) {
                throw new ApiError(400, result.error.issues[0].message);
            }

            const { q } = result.data;
            const searchResult = await searchService.search(q);

            return sendSuccess(res, searchResult, "Search completed successfully.");
        } catch (error) {
            next(error);
        }
    }
}

export const searchController = new SearchController();
