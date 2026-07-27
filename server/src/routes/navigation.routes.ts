import { Router } from "express";
import { navigationController } from "../controllers/navigation.controller.js";
import { validateNavigationOfficeId } from "../validators/navigation.validator.js";

const router = Router();

router.get(
    "/:officeId",
    validateNavigationOfficeId,
    navigationController.navigate
);

export default router;
