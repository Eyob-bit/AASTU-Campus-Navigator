import { Request, Response, NextFunction } from "express";
import { FloorService } from "../services/floor.service.js";
import { sendSuccess } from "../utils/response.js";

const floorService = new FloorService();

export class FloorController {
    async getFloorsByBuilding(
        req: Request<{ buildingId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const floors = await floorService.getFloorsByBuilding(req.params.buildingId);

            return sendSuccess(
                res,
                {
                    count: floors.length,
                    floors,
                },
                "Floors retrieved successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async getFloorById(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const floor = await floorService.getFloorWithDetails(req.params.id);

            return sendSuccess(
                res,
                floor,
                "Floor retrieved successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async createFloor(
        req: Request<{ buildingId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const floor = await floorService.createFloor({
                buildingId: req.params.buildingId,
                floorNumber: req.body.floorNumber,
            });

            return sendSuccess(
                res,
                floor,
                "Floor created successfully",
                201
            );
        } catch (error) {
            next(error);
        }
    }

    async updateFloor(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const floor = await floorService.updateFloor(
                req.params.id,
                req.body
            );

            return sendSuccess(
                res,
                floor,
                "Floor updated successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async deleteFloor(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            await floorService.deleteFloor(req.params.id);

            return sendSuccess(
                res,
                null,
                "Floor deleted successfully"
            );
        } catch (error) {
            next(error);
        }
    }
}

export const floorController = new FloorController();
