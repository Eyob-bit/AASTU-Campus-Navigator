import { Router } from "express";
import { infoContentController } from "../controllers/infoContent.controller.js";

const router = Router();

// ── Channels ─────────────────────────────────────────────────────────────────
// Public: active only
router.get("/channels", infoContentController.getActiveChannels);
// Admin: all (including inactive)
router.get("/channels/all", infoContentController.getAllChannels);
router.post("/channels", infoContentController.createChannel);
router.patch("/channels/:id", infoContentController.updateChannel);
router.delete("/channels/:id", infoContentController.deleteChannel);

// ── Contacts ─────────────────────────────────────────────────────────────────
router.get("/contacts", infoContentController.getActiveContacts);
router.get("/contacts/all", infoContentController.getAllContacts);
router.post("/contacts", infoContentController.createContact);
router.patch("/contacts/:id", infoContentController.updateContact);
router.delete("/contacts/:id", infoContentController.deleteContact);

// ── Links ─────────────────────────────────────────────────────────────────────
router.get("/links", infoContentController.getActiveLinks);
router.get("/links/all", infoContentController.getAllLinks);
router.post("/links", infoContentController.createLink);
router.patch("/links/:id", infoContentController.updateLink);
router.delete("/links/:id", infoContentController.deleteLink);

export default router;
