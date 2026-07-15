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

export default router;