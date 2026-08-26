import { Router } from "express";
import { officeController } from "../controllers/office.controller.js";
import { staffController } from "../controllers/staff.controller.js";
import { aliasController } from "../controllers/alias.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { requireAdminAuth } from "../middleware/auth.middleware.js";
import { updateOfficeSchema } from "../validators/office.validator.js";
import { createStaffSchema } from "../validators/staff.validator.js";
import { createAliasSchema } from "../validators/alias.validator.js";

const router = Router();

router.get("/:id", officeController.getOfficeById);

router.patch(
    "/:id",
    requireAdminAuth,
    validate(updateOfficeSchema),
    officeController.updateOffice
);

router.delete("/:id", requireAdminAuth, officeController.deleteOffice);

// Nested staff routes
router.get("/:officeId/staff", staffController.getStaffByOffice);
router.post(
    "/:officeId/staff",
    requireAdminAuth,
    validate(createStaffSchema),
    staffController.createStaff
);

// Nested alias routes
router.get("/:officeId/aliases", aliasController.getOfficeAliases);
router.post(
    "/:officeId/aliases",
    requireAdminAuth,
    validate(createAliasSchema),
    aliasController.createOfficeAlias
);

export default router;
