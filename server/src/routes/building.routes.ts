import { Router } from "express";
import { buildingController } from "../controllers/building.controller.js";
import { floorController } from "../controllers/floor.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { createBuildingSchema, updateBuildingSchema } from "../validators/building.validator.js";
import { createFloorSchema } from "../validators/floor.validator.js";

const router = Router();

router.get("/", buildingController.getBuildings);

router.get("/:id", buildingController.getBuildingById);

router.post(
    "/",
    validate(createBuildingSchema),
    buildingController.createBuilding
);

router.patch(
    "/:id",
    validate(updateBuildingSchema),
    buildingController.updateBuilding
);

router.delete("/:id", buildingController.deleteBuilding);

// Nested floor routes
router.get("/:buildingId/floors", floorController.getFloorsByBuilding);
router.post(
    "/:buildingId/floors",
    validate(createFloorSchema),
    floorController.createFloor
);

export default router;