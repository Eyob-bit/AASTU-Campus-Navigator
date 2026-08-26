import { Router } from "express";
import { floorController } from "../controllers/floor.controller.js";
import { officeController } from "../controllers/office.controller.js";
import { sceneController } from "../controllers/scene.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { requireAdminAuth } from "../middleware/auth.middleware.js";
import { updateFloorSchema } from "../validators/floor.validator.js";
import { createOfficeSchema } from "../validators/office.validator.js";
import { createSceneSchema } from "../validators/scene.validator.js";
import { uploadPanorama } from "../middleware/upload.middleware.js";

const router = Router();

router.get("/:id", floorController.getFloorById);

router.patch(
    "/:id",
    requireAdminAuth,
    validate(updateFloorSchema),
    floorController.updateFloor
);

router.delete("/:id", requireAdminAuth, floorController.deleteFloor);

// Nested office routes
router.get("/:floorId/offices", officeController.getOfficesByFloor);
router.post(
    "/:floorId/offices",
    requireAdminAuth,
    validate(createOfficeSchema),
    officeController.createOffice
);

// Nested scene routes
router.get("/:floorId/scenes", sceneController.getScenesByFloor);
router.post(
    "/:floorId/scenes",
    requireAdminAuth,
    uploadPanorama,
    validate(createSceneSchema),
    sceneController.createScene
);

export default router;
