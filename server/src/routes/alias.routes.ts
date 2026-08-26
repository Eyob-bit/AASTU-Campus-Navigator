import { Router } from "express";
import { aliasController } from "../controllers/alias.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { requireAdminAuth } from "../middleware/auth.middleware.js";
import { updateAliasSchema } from "../validators/alias.validator.js";

const router = Router();

router.get("/", aliasController.getAllAliases);
router.get("/:id", aliasController.getAliasById);

router.patch(
    "/:id",
    requireAdminAuth,
    validate(updateAliasSchema),
    aliasController.updateAlias
);

router.delete("/:id", requireAdminAuth, aliasController.deleteAlias);

export default router;
