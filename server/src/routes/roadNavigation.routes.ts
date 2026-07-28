import { Router } from "express";
import { calculateRoute } from "../controllers/roadNavigation.controller.js";

const router = Router();

router.post("/route", calculateRoute);

export default router;
