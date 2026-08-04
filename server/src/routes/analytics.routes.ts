import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller.js";

const router = Router();

router.get("/overview", analyticsController.getOverview);
router.get("/top-searches", analyticsController.getTopSearches);
router.get("/no-results", analyticsController.getNoResults);
router.get("/search-trend", analyticsController.getSearchTrend);
router.get("/navigation", analyticsController.getNavigationStats);
router.get("/popular-buildings", analyticsController.getPopularBuildings);

export default router;
