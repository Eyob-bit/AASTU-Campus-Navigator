import { Router } from "express";
import { AdminProfileController } from "../controllers/adminProfile.controller.js";

const router = Router();
const ctrl = new AdminProfileController();

router.get("/", ctrl.getProfile.bind(ctrl));
router.patch("/", ctrl.updateProfile.bind(ctrl));
router.post("/password", ctrl.changePassword.bind(ctrl));

export default router;
