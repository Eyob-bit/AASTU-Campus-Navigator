import { Request, Response, NextFunction } from "express";
import { NavigationService } from "../services/navigation.service.js";
import { sendSuccess } from "../utils/response.js";

export class NavigationController {
    private navigationService = new NavigationService();

    navigate = async (
        req: Request<{ officeId: string }>,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { officeId } = req.params;
            const result = await this.navigationService.navigate(officeId);

            return sendSuccess(
                res,
                result,
                "Navigation path generated successfully."
            );
        } catch (error) {
            next(error);
        }
    };
}

export const navigationController = new NavigationController();
