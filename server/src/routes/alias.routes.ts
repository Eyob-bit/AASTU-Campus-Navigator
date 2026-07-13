import { Router } from "express";
import { aliasController } from "../controllers/alias.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { updateAliasSchema } from "../validators/alias.validator.js";

const router = Router();

router.get("/:id", aliasController.getAliasById);

router.patch(
    "/:id",
    validate(updateAliasSchema),
    aliasController.updateAlias
);

router.delete("/:id", aliasController.deleteAlias);

export default router;
