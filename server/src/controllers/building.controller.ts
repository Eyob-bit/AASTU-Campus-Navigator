import { Request, Response, NextFunction } from "express";
import { BuildingService } from "../services/building.service.js";
import { sendSuccess } from "../utils/response.js";

const buildingService = new BuildingService();

export class BuildingController {
    async getBuildings(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const buildings = await buildingService.getBuildings();

            return sendSuccess(
                res,
                {
                    count: buildings.length,
                    buildings,
                },
                "Buildings retrieved successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async createBuilding(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const building = await buildingService.createBuilding(req.body);

            return sendSuccess(
                res,
                building,
                "Building created successfully",
                201
            );
        } catch (error) {
            next(error);
        }
    }
}

export const buildingController = new BuildingController();