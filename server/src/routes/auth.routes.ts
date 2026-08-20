import { Router } from "express";
import { adminLogin } from "../controllers/auth.controller.js";

const router = Router();

// POST /api/auth/login
router.post("/login", adminLogin);

export default router;
