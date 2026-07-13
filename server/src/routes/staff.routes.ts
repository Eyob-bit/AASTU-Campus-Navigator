import { Router } from "express";
import { staffController } from "../controllers/staff.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { updateStaffSchema } from "../validators/staff.validator.js";

const router = Router();

router.get("/:id", staffController.getStaffById);

router.patch(
    "/:id",
    validate(updateStaffSchema),
    staffController.updateStaff
);

router.delete("/:id", staffController.deleteStaff);

export default router;
