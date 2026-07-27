import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";

export const navigationOfficeIdSchema = z.object({
    officeId: z
        .string()
        .trim()
        .min(1, "Invalid office id.")
        .cuid("Invalid office id."),
});

export function validateNavigationOfficeId(
    req: Request,
    _res: Response,
    next: NextFunction
) {
    const result = navigationOfficeIdSchema.safeParse(req.params);

    if (!result.success) {
        return next(new ApiError(400, "Invalid office id."));
    }

    req.params.officeId = result.data.officeId;
    next();
}
