import { Router } from "express";
import { officeController } from "../controllers/office.controller.js";
import { staffController } from "../controllers/staff.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { updateOfficeSchema } from "../validators/office.validator.js";
import { createStaffSchema } from "../validators/staff.validator.js";

const router = Router();

router.get("/:id", officeController.getOfficeById);

router.patch(
    "/:id",
    validate(updateOfficeSchema),
    officeController.updateOffice
);

router.delete("/:id", officeController.deleteOffice);

// Nested staff routes
router.get("/:officeId/staff", staffController.getStaffByOffice);
router.post(
    "/:officeId/staff",
    validate(createStaffSchema),
    staffController.createStaff
);

export default router;
