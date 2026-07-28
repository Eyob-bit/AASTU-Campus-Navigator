import { Router } from "express";
import { searchController } from "../controllers/search.controller.js";

const router = Router();

router.get("/", searchController.search);
router.get("/landmarks", searchController.searchLandmarks);

export default router;
