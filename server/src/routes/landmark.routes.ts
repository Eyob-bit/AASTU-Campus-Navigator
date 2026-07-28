import { Router } from "express";
import { landmarkController } from "../controllers/landmark.controller.js";

const router = Router();

// Search must come before /:id to avoid param collision
router.get("/search", landmarkController.searchLandmarks);

router.get("/", landmarkController.getLandmarks);
router.get("/:id", landmarkController.getLandmarkById);
router.post("/", landmarkController.createLandmark);
router.patch("/:id", landmarkController.updateLandmark);
router.delete("/:id", landmarkController.deleteLandmark);

export default router;
