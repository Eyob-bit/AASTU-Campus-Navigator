import { Router } from "express";
import { healthCheck } from "../controllers/health.controller.js";
import buildingRoutes from "./building.routes.js";
import floorRoutes from "./floor.routes.js";
import officeRoutes from "./office.routes.js";
import staffRoutes from "./staff.routes.js";
import aliasRoutes from "./alias.routes.js";
import sceneRoutes from "./scene.routes.js";
import sceneElementRoutes from "./scene-element.routes.js";
import searchRoutes from "./search.routes.js";
import navigationRoutes from "./navigation.routes.js";
import landmarkRoutes from "./landmark.routes.js";
import roadNodeRoutes from "./roadNode.routes.js";
import roadEdgeRoutes from "./roadEdge.routes.js";
import roadNavigationRoutes from "./roadNavigation.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import adminProfileRoutes from "./adminProfile.routes.js";

const router = Router();

router.get("/", healthCheck);

router.use("/buildings", buildingRoutes);
router.use("/floors", floorRoutes);
router.use("/offices", officeRoutes);
router.use("/staff", staffRoutes);
router.use("/aliases", aliasRoutes);
router.use("/scenes", sceneRoutes);
router.use("/elements", sceneElementRoutes);
router.use("/search", searchRoutes);
router.use("/navigation", navigationRoutes);
router.use("/navigation", roadNavigationRoutes);
router.use("/landmarks", landmarkRoutes);
router.use("/road-nodes", roadNodeRoutes);
router.use("/road-edges", roadEdgeRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/admin-profile", adminProfileRoutes);

export default router;