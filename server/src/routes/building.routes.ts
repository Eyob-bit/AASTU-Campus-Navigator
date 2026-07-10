import { Router } from "express";
import { buildingController } from "../controllers/building.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { createBuildingSchema } from "../validators/building.validator.js";

const router = Router();

router.get("/", buildingController.getBuildings);

router.post(
    "/",
    validate(createBuildingSchema),
    buildingController.createBuilding
);

export default router;