import { Router } from "express";
import {
    getComplexes,
    getComplexById,
    createComplex,
    updateComplex,
    deleteComplex,
    getConnections,
    createConnection,
    deleteConnection,
} from "../controllers/complex.controller.js";
import { requireAdminAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Public read endpoints
router.get("/", getComplexes);
router.get("/connections", getConnections);
router.get("/:id", getComplexById);

// Admin-protected mutations
router.post("/", requireAdminAuth, createComplex);
router.put("/:id", requireAdminAuth, updateComplex);
router.delete("/:id", requireAdminAuth, deleteComplex);

router.post("/connections", requireAdminAuth, createConnection);
router.delete("/connections/:id", requireAdminAuth, deleteConnection);

export default router;
