import { Router } from "express";
import { sceneElementController } from "../controllers/scene-element.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { requireAdminAuth } from "../middleware/auth.middleware.js";
import { updateSceneElementSchema } from "../validators/scene-element.validator.js";

const router = Router();

router.get("/:id", sceneElementController.getElementById);

router.patch(
    "/:id",
    requireAdminAuth,
    validate(updateSceneElementSchema),
    sceneElementController.updateElement
);

router.delete("/:id", requireAdminAuth, sceneElementController.deleteElement);

export default router;
