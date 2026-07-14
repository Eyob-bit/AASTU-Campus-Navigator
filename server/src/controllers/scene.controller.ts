import { Request, Response, NextFunction } from "express";
import { SceneService } from "../services/scene.service.js";
import { sendSuccess } from "../utils/response.js";

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
            const scene = await sceneService.createScene(
                req.params.floorId,
                req.body
            );

            return sendSuccess(
                res,
                scene,
                "Scene created successfully",
                201
            );
        } catch (error) {
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
                req.body
            );

            return sendSuccess(
                res,
                scene,
                "Scene updated successfully"
            );
        } catch (error) {
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
