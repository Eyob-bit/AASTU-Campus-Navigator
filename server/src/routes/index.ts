import { Router } from "express";
import { healthCheck } from "../controllers/health.controller.js";
import authRoutes from "./auth.routes.js";
import buildingRoutes from "./building.routes.js";
import floorRoutes from "./floor.routes.js";
import officeRoutes from "./office.routes.js";
import staffRoutes from "./staff.routes.js";
import aliasRoutes from "./alias.routes.js";
import sceneRoutes from "./scene.routes.js";
import sceneElementRoutes from "./scene-element.routes.js";
import searchRoutes from "./search.routes.js";
import navigationRoutes from "./navigation.routes.js";
import landmarkRoutes from "./landmark.routes.js";
import roadNodeRoutes from "./roadNode.routes.js";
import roadEdgeRoutes from "./roadEdge.routes.js";
import roadNavigationRoutes from "./roadNavigation.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import adminProfileRoutes from "./adminProfile.routes.js";
import infoContentRoutes from "./infoContent.routes.js";
import { chatRouter } from "./chat.routes.js";
import { requireAdminAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", healthCheck);

// ── Public ─────────────────────────────────────────────────────────────────
router.use("/auth", authRoutes);            // POST /api/auth/login (public)
router.use("/search", searchRoutes);        // Campus search (public, used by client app)
router.use("/navigation", navigationRoutes); // Indoor navigation (public)
router.use("/navigation", roadNavigationRoutes); // A* route (public)
router.use("/chat", chatRouter);            // AI chatbot (public)
// Public read-only endpoints for campus map/client
router.use("/buildings", buildingRoutes);
router.use("/floors", floorRoutes);
router.use("/offices", officeRoutes);
router.use("/staff", staffRoutes);
router.use("/aliases", aliasRoutes);
router.use("/scenes", sceneRoutes);
router.use("/elements", sceneElementRoutes);
router.use("/landmarks", landmarkRoutes);
router.use("/road-nodes", roadNodeRoutes);
router.use("/road-edges", roadEdgeRoutes);

// ── Admin-protected ─────────────────────────────────────────────────────────
router.use("/analytics", requireAdminAuth, analyticsRoutes);
router.use("/admin-profile", requireAdminAuth, adminProfileRoutes);
router.use("/info-content", infoContentRoutes); // has public-read sub-routes

export default router;