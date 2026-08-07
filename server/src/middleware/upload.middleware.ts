import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { upload } from "./upload.js";

export const uploadPanorama = (req: Request, res: Response, next: NextFunction) => {
    const singleUpload = upload.single("image");

    singleUpload(req, res, (err: any) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return next(new ApiError(400, "File size must not exceed 20 MB"));
                }
                return next(new ApiError(400, `Upload error: ${err.message}`));
            }
            return next(err);
        }
        next();
    });
};
