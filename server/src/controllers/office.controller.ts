import { Request, Response, NextFunction } from "express";
import { OfficeService } from "../services/office.service.js";
import { sendSuccess } from "../utils/response.js";

const officeService = new OfficeService();

export class OfficeController {
    async getOfficesByFloor(
        req: Request<{ floorId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const offices = await officeService.getOfficesByFloor(req.params.floorId);

            return sendSuccess(
                res,
                {
                    count: offices.length,
                    offices,
                },
                "Offices retrieved successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async getOfficeById(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const office = await officeService.getOfficeWithDetails(req.params.id);

            return sendSuccess(
                res,
                office,
                "Office retrieved successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async createOffice(
        req: Request<{ floorId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const office = await officeService.createOffice({
                floorId: req.params.floorId,
                name: req.body.name,
                roomNumber: req.body.roomNumber,
                description: req.body.description,
            });

            return sendSuccess(
                res,
                office,
                "Office created successfully",
                201
            );
        } catch (error) {
            next(error);
        }
    }

    async updateOffice(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const office = await officeService.updateOffice(
                req.params.id,
                req.body
            );

            return sendSuccess(
                res,
                office,
                "Office updated successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async deleteOffice(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            await officeService.deleteOffice(req.params.id);

            return sendSuccess(
                res,
                null,
                "Office deleted successfully"
            );
        } catch (error) {
            next(error);
        }
    }
}

export const officeController = new OfficeController();
