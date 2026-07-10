import { Router } from "express";
import { healthCheck } from "../controllers/health.controller.js";
import buildingRoutes from "./building.routes.js";

const router = Router();

router.get("/", healthCheck);

router.use("/buildings", buildingRoutes);

export default router;