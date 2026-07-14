import { Router } from "express";
import { sceneController } from "../controllers/scene.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { updateSceneSchema } from "../validators/scene.validator.js";

const router = Router();

router.get("/:id", sceneController.getSceneById);

router.patch(
    "/:id",
    validate(updateSceneSchema),
    sceneController.updateScene
);

router.delete("/:id", sceneController.deleteScene);

export default router;
