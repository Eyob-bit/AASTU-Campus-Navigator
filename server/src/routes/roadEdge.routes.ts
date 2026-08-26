import { Router } from "express";
import { requireAdminAuth } from "../middleware/auth.middleware.js";
import {
  getRoadEdges,
  getRoadEdgeById,
  createRoadEdge,
  updateRoadEdge,
  deleteRoadEdge,
} from "../controllers/roadEdge.controller.js";

const router = Router();

router.get("/", getRoadEdges);
router.get("/:id", getRoadEdgeById);
router.post("/", requireAdminAuth, createRoadEdge);
router.patch("/:id", requireAdminAuth, updateRoadEdge);
router.delete("/:id", requireAdminAuth, deleteRoadEdge);

export default router;
