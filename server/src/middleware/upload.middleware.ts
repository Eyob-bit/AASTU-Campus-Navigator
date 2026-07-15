import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import path from "path";
import fs from "fs";
import { generateUniqueFilename } from "../utils/file.util.js";

const uploadDir = "uploads/panoramas";

// Synchronously ensure the directory exists at file load time
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = generateUniqueFilename(file.originalname);
        cb(null, uniqueName);
    },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];

    if (!allowedExtensions.includes(ext)) {
        return cb(new ApiError(400, "Only jpeg, jpg, png, and webp images are allowed"));
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new ApiError(400, "Only jpeg, jpg, png, and webp images are allowed"));
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB
    },
});

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
