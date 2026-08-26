import { Router } from "express";
import { infoContentController } from "../controllers/infoContent.controller.js";
import { requireAdminAuth } from "../middleware/auth.middleware.js";

const router = Router();

// ── Channels ─────────────────────────────────────────────────────────────────
// Public: active only
router.get("/channels", infoContentController.getActiveChannels);
// Admin: all (including inactive)
router.get("/channels/all", requireAdminAuth, infoContentController.getAllChannels);
router.post("/channels", requireAdminAuth, infoContentController.createChannel);
router.patch("/channels/:id", requireAdminAuth, infoContentController.updateChannel);
router.delete("/channels/:id", requireAdminAuth, infoContentController.deleteChannel);

// ── Contacts ─────────────────────────────────────────────────────────────────
router.get("/contacts", infoContentController.getActiveContacts);
router.get("/contacts/all", requireAdminAuth, infoContentController.getAllContacts);
router.post("/contacts", requireAdminAuth, infoContentController.createContact);
router.patch("/contacts/:id", requireAdminAuth, infoContentController.updateContact);
router.delete("/contacts/:id", requireAdminAuth, infoContentController.deleteContact);

// ── Links ─────────────────────────────────────────────────────────────────────
router.get("/links", infoContentController.getActiveLinks);
router.get("/links/all", requireAdminAuth, infoContentController.getAllLinks);
router.post("/links", requireAdminAuth, infoContentController.createLink);
router.patch("/links/:id", requireAdminAuth, infoContentController.updateLink);
router.delete("/links/:id", requireAdminAuth, infoContentController.deleteLink);

export default router;
