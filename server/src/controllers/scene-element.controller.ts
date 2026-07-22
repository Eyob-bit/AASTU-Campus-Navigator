import { Request, Response, NextFunction } from "express";
import { SceneElementService } from "../services/scene-element.service.js";
import { sendSuccess } from "../utils/response.js";

const elementService = new SceneElementService();

export class SceneElementController {
    async getElementsByScene(
        req: Request<{ sceneId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const elements = await elementService.getElementsByScene(req.params.sceneId);

            return sendSuccess(
                res,
                {
                    count: elements.length,
                    elements,
                },
                "Scene elements retrieved successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async getElementById(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const element = await elementService.getElementById(req.params.id);

            return sendSuccess(
                res,
                element,
                "Scene element retrieved successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async createElement(
        req: Request<{ sceneId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const element = await elementService.createElement(
                req.params.sceneId,
                req.body
            );

            return sendSuccess(
                res,
                element,
                "Scene element created successfully",
                201
            );
        } catch (error) {
            next(error);
        }
    }

    async updateElement(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const element = await elementService.updateElement(
                req.params.id,
                req.body
            );

            return sendSuccess(
                res,
                element,
                "Scene element updated successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async deleteElement(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            await elementService.deleteElement(req.params.id);

            return sendSuccess(
                res,
                null,
                "Scene element deleted successfully"
            );
        } catch (error) {
            next(error);
        }
    }
}

export const sceneElementController = new SceneElementController();
