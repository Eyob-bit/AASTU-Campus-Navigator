import { Router } from "express";
import { officeController } from "../controllers/office.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { updateOfficeSchema } from "../validators/office.validator.js";

const router = Router();

router.get("/:id", officeController.getOfficeById);

router.patch(
    "/:id",
    validate(updateOfficeSchema),
    officeController.updateOffice
);

router.delete("/:id", officeController.deleteOffice);

export default router;
