import { Request, Response, NextFunction } from "express";
import { SceneService } from "../services/scene.service.js";
import { sendSuccess } from "../utils/response.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFile } from "../utils/file.util.js";

const sceneService = new SceneService();

export class SceneController {
    async getScenesByFloor(
        req: Request<{ floorId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const scenes = await sceneService.getScenesByFloor(req.params.floorId);

            return sendSuccess(
                res,
                {
                    count: scenes.length,
                    scenes,
                },
                "Scenes retrieved successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async getSceneById(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const scene = await sceneService.getSceneById(req.params.id);

            return sendSuccess(
                res,
                scene,
                "Scene retrieved successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async createScene(
        req: Request<{ floorId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            if (!req.file) {
                throw new ApiError(400, "A scene must have one panorama image.");
            }

            const scene = await sceneService.createScene(
                req.params.floorId,
                req.body,
                req.file
            );

            return sendSuccess(
                res,
                scene,
                "Scene created successfully",
                201
            );
        } catch (error) {
            if (req.file) {
                deleteFile(req.file.path).catch((err) =>
                    console.error("Failed to delete file after creation error:", err)
                );
            }
            next(error);
        }
    }

    async updateScene(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const scene = await sceneService.updateScene(
                req.params.id,
                req.body,
                req.file
            );

            return sendSuccess(
                res,
                scene,
                "Scene updated successfully"
            );
        } catch (error) {
            if (req.file) {
                deleteFile(req.file.path).catch((err) =>
                    console.error("Failed to delete file after update error:", err)
                );
            }
            next(error);
        }
    }

    async deleteScene(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            await sceneService.deleteScene(req.params.id);

            return sendSuccess(
                res,
                null,
                "Scene deleted successfully"
            );
        } catch (error) {
            next(error);
        }
    }
}

export const sceneController = new SceneController();
