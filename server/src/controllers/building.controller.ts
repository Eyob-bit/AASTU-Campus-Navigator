import { Request, Response, NextFunction } from "express";
import { BuildingService } from "../services/building.service.js";
import { sendSuccess } from "../utils/response.js";
import { ApiError } from "../utils/ApiError.js";

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

    async getBuildingById(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const building = await buildingService.getBuildingById(req.params.id);

            if (!building) {
                throw new ApiError(404, "Building not found");
            }

            return sendSuccess(
                res,
                building,
                "Building retrieved successfully"
            );
        } catch (err) {
            next(err);
        }
    }

    async updateBuilding(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const existingBuilding = await buildingService.getBuilding(req.params.id);
            if (!existingBuilding) {
                throw new ApiError(404, "Building not found");
            }

            const building = await buildingService.updateBuilding(
                req.params.id,
                req.body
            );

            return sendSuccess(
                res,
                building,
                "Building updated successfully"
            );
        } catch (err) {
            next(err);
        }
    }

    async deleteBuilding(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const existingBuilding = await buildingService.getBuilding(req.params.id);
            if (!existingBuilding) {
                throw new ApiError(404, "Building not found");
            }

            await buildingService.deleteBuilding(req.params.id);

            return sendSuccess(
                res,
                null,
                "Building deleted successfully"
            );
        } catch (err) {
            next(err);
        }
    }
}

export const buildingController = new BuildingController();