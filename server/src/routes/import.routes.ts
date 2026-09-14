import { Router } from "express";
import { validateDataset, importDataset } from "../controllers/import.controller.js";
import { requireAdminAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/validate", requireAdminAuth, validateDataset);
router.post("/", requireAdminAuth, importDataset);

export default router;
