import { Request, Response, NextFunction } from "express";
import { AliasService } from "../services/alias.service.js";
import { sendSuccess } from "../utils/response.js";

const aliasService = new AliasService();

export class AliasController {
    async getAllAliases(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const aliases = await aliasService.getAllAliases();
            return sendSuccess(
                res,
                {
                    count: aliases.length,
                    aliases,
                },
                "All search aliases retrieved successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async getOfficeAliases(
        req: Request<{ officeId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const aliases = await aliasService.getAliasesByOffice(req.params.officeId);

            return sendSuccess(
                res,
                {
                    count: aliases.length,
                    aliases,
                },
                "Office aliases retrieved successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async getStaffAliases(
        req: Request<{ staffId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const aliases = await aliasService.getAliasesByStaff(req.params.staffId);

            return sendSuccess(
                res,
                {
                    count: aliases.length,
                    aliases,
                },
                "Staff aliases retrieved successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async getAliasById(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const alias = await aliasService.getAliasById(req.params.id);

            return sendSuccess(
                res,
                alias,
                "Alias retrieved successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async createOfficeAlias(
        req: Request<{ officeId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const alias = await aliasService.createOfficeAlias(
                req.params.officeId,
                req.body
            );

            return sendSuccess(
                res,
                alias,
                "Alias created successfully",
                201
            );
        } catch (error) {
            next(error);
        }
    }

    async createStaffAlias(
        req: Request<{ staffId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const alias = await aliasService.createStaffAlias(
                req.params.staffId,
                req.body
            );

            return sendSuccess(
                res,
                alias,
                "Alias created successfully",
                201
            );
        } catch (error) {
            next(error);
        }
    }

    async updateAlias(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const alias = await aliasService.updateAlias(
                req.params.id,
                req.body
            );

            return sendSuccess(
                res,
                alias,
                "Alias updated successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async deleteAlias(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            await aliasService.deleteAlias(req.params.id);

            return sendSuccess(
                res,
                null,
                "Alias deleted successfully"
            );
        } catch (error) {
            next(error);
        }
    }
}

export const aliasController = new AliasController();
