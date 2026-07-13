import { Router } from "express";
import { staffController } from "../controllers/staff.controller.js";
import { aliasController } from "../controllers/alias.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { updateStaffSchema } from "../validators/staff.validator.js";
import { createAliasSchema } from "../validators/alias.validator.js";

const router = Router();

router.get("/:id", staffController.getStaffById);

router.patch(
    "/:id",
    validate(updateStaffSchema),
    staffController.updateStaff
);

router.delete("/:id", staffController.deleteStaff);

// Nested alias routes
router.get("/:staffId/aliases", aliasController.getStaffAliases);
router.post(
    "/:staffId/aliases",
    validate(createAliasSchema),
    aliasController.createStaffAlias
);

export default router;
