import { Router } from "express";
import { requireAdminAuth } from "../middleware/auth.middleware.js";
import {
  getRoadNodes,
  getRoadNodeById,
  createRoadNode,
  updateRoadNode,
  deleteRoadNode,
} from "../controllers/roadNode.controller.js";

const router = Router();

router.get("/", getRoadNodes);
router.get("/:id", getRoadNodeById);
router.post("/", requireAdminAuth, createRoadNode);
router.patch("/:id", requireAdminAuth, updateRoadNode);
router.delete("/:id", requireAdminAuth, deleteRoadNode);

export default router;
