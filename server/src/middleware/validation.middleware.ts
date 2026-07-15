import { ZodObject } from "zod";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { deleteFile } from "../utils/file.util.js";

export const validate =
    (schema: ZodObject) =>
        (req: Request, res: Response, next: NextFunction) => {
            const result = schema.safeParse(req.body);

            if (!result.success) {
                if (req.file) {
                    deleteFile(req.file.path).catch((err) =>
                        console.error("Failed to delete file on validation failure:", err)
                    );
                }
                return next(new ApiError(400, result.error.issues[0].message));
            }

            req.body = result.data;

            next();
        };