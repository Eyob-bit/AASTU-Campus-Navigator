import { Router } from "express";
import { sceneController } from "../controllers/scene.controller.js";
import { sceneElementController } from "../controllers/scene-element.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { updateSceneSchema } from "../validators/scene.validator.js";
import { createSceneElementSchema } from "../validators/scene-element.validator.js";

const router = Router();

router.get("/:id", sceneController.getSceneById);

router.patch(
    "/:id",
    validate(updateSceneSchema),
    sceneController.updateScene
);

router.delete("/:id", sceneController.deleteScene);

// Nested scene elements routes
router.get("/:sceneId/elements", sceneElementController.getElementsByScene);
router.post(
    "/:sceneId/elements",
    validate(createSceneElementSchema),
    sceneElementController.createElement
);

export default router;
