import { Router } from "express";
import { sceneController } from "../controllers/scene.controller.js";
import { sceneElementController } from "../controllers/scene-element.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { requireAdminAuth } from "../middleware/auth.middleware.js";
import { updateSceneSchema } from "../validators/scene.validator.js";
import { createSceneElementSchema } from "../validators/scene-element.validator.js";
import { uploadPanorama } from "../middleware/upload.middleware.js";

const router = Router();

router.get("/default", sceneController.getDefaultScene);
router.get("/:id", sceneController.getSceneById);

router.patch(
    "/:id",
    requireAdminAuth,
    uploadPanorama,
    validate(updateSceneSchema),
    sceneController.updateScene
);

router.delete("/:id", requireAdminAuth, sceneController.deleteScene);

// Nested scene elements routes
router.get("/:sceneId/elements", sceneElementController.getElementsByScene);
router.post(
    "/:sceneId/elements",
    requireAdminAuth,
    validate(createSceneElementSchema),
    sceneElementController.createElement
);

export default router;
