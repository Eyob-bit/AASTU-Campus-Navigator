import { Router } from "express";
import { floorController } from "../controllers/floor.controller.js";
import { officeController } from "../controllers/office.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { updateFloorSchema } from "../validators/floor.validator.js";
import { createOfficeSchema } from "../validators/office.validator.js";

const router = Router();

router.get("/:id", floorController.getFloorById);

router.patch(
    "/:id",
    validate(updateFloorSchema),
    floorController.updateFloor
);

router.delete("/:id", floorController.deleteFloor);

// Nested office routes
router.get("/:floorId/offices", officeController.getOfficesByFloor);
router.post(
    "/:floorId/offices",
    validate(createOfficeSchema),
    officeController.createOffice
);

export default router;
