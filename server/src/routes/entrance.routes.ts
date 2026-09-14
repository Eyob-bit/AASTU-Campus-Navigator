import { Router } from "express";
import {
    getEntrancesByBuilding,
    createEntrance,
    updateEntrance,
    deleteEntrance,
} from "../controllers/entrance.controller.js";
import { requireAdminAuth } from "../middleware/auth.middleware.js";

const router = Router({ mergeParams: true });

// Read endpoints
router.get("/", getEntrancesByBuilding);

// Admin mutations
router.post("/", requireAdminAuth, createEntrance);
router.put("/:id", requireAdminAuth, updateEntrance);
router.delete("/:id", requireAdminAuth, deleteEntrance);

export default router;
