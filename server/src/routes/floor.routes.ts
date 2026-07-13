import { Router } from "express";
import { floorController } from "../controllers/floor.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { updateFloorSchema } from "../validators/floor.validator.js";

const router = Router();

router.get("/:id", floorController.getFloorById);

router.patch(
    "/:id",
    validate(updateFloorSchema),
    floorController.updateFloor
);

router.delete("/:id", floorController.deleteFloor);

export default router;
