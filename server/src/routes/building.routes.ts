import { Router } from "express";
import { buildingController } from "../controllers/building.controller.js";
import { floorController } from "../controllers/floor.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { requireAdminAuth } from "../middleware/auth.middleware.js";
import { createBuildingSchema, updateBuildingSchema } from "../validators/building.validator.js";
import { createFloorSchema } from "../validators/floor.validator.js";

const router = Router();

router.get("/", buildingController.getBuildings);

router.get("/:id", buildingController.getBuildingById);

router.post(
    "/",
    requireAdminAuth,
    validate(createBuildingSchema),
    buildingController.createBuilding
);

router.patch(
    "/:id",
    requireAdminAuth,
    validate(updateBuildingSchema),
    buildingController.updateBuilding
);

router.delete("/:id", requireAdminAuth, buildingController.deleteBuilding);

// Nested floor routes
router.get("/:buildingId/floors", floorController.getFloorsByBuilding);
router.post(
    "/:buildingId/floors",
    requireAdminAuth,
    validate(createFloorSchema),
    floorController.createFloor
);

export default router;