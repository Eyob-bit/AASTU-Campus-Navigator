import { Router } from "express";
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
router.post("/", createRoadNode);
router.patch("/:id", updateRoadNode);
router.delete("/:id", deleteRoadNode);

export default router;
