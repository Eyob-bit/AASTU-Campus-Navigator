import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "aastu/panoramas",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
    } as any,
});

export const upload = multer({
    storage,
});
