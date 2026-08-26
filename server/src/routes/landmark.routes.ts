import { Router } from "express";
import { landmarkController } from "../controllers/landmark.controller.js";
import { requireAdminAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Search must come before /:id to avoid param collision
router.get("/search", landmarkController.searchLandmarks);

router.get("/", landmarkController.getLandmarks);
router.get("/:id", landmarkController.getLandmarkById);
router.post("/", requireAdminAuth, landmarkController.createLandmark);
router.patch("/:id", requireAdminAuth, landmarkController.updateLandmark);
router.delete("/:id", requireAdminAuth, landmarkController.deleteLandmark);

export default router;
