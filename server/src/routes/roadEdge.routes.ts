import { Router } from "express";
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
router.post("/", createRoadEdge);
router.patch("/:id", updateRoadEdge);
router.delete("/:id", deleteRoadEdge);

export default router;
