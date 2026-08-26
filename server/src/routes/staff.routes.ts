import { Router } from "express";
import { staffController } from "../controllers/staff.controller.js";
import { aliasController } from "../controllers/alias.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { requireAdminAuth } from "../middleware/auth.middleware.js";
import { updateStaffSchema } from "../validators/staff.validator.js";
import { createAliasSchema } from "../validators/alias.validator.js";

const router = Router();

router.get("/:id", staffController.getStaffById);

router.patch(
    "/:id",
    requireAdminAuth,
    validate(updateStaffSchema),
    staffController.updateStaff
);

router.delete("/:id", requireAdminAuth, staffController.deleteStaff);

// Nested alias routes
router.get("/:staffId/aliases", aliasController.getStaffAliases);
router.post(
    "/:staffId/aliases",
    requireAdminAuth,
    validate(createAliasSchema),
    aliasController.createStaffAlias
);

export default router;
