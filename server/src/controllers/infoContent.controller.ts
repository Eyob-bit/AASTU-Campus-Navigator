import { Request, Response, NextFunction } from "express";
import { InfoContentService } from "../services/infoContent.service.js";
import { sendSuccess } from "../utils/response.js";
import { ApiError } from "../utils/ApiError.js";

const service = new InfoContentService();

export class InfoContentController {
  // ═══════════════════════════════════════════════════════
  // CHANNELS
  // ═══════════════════════════════════════════════════════

  /** GET /info-content/channels — returns only active channels (public) */
  async getActiveChannels(req: Request, res: Response, next: NextFunction) {
    try {
      const channels = await service.getActiveChannels();
      return sendSuccess(res, { count: channels.length, channels }, "Channels retrieved successfully");
    } catch (err) { next(err); }
  }

  /** GET /info-content/channels/all — returns all channels including inactive (admin) */
  async getAllChannels(req: Request, res: Response, next: NextFunction) {
    try {
      const channels = await service.getAllChannels();
      return sendSuccess(res, { count: channels.length, channels }, "All channels retrieved successfully");
    } catch (err) { next(err); }
  }

  async createChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const channel = await service.createChannel(req.body);
      return sendSuccess(res, channel, "Channel created successfully", 201);
    } catch (err) { next(err); }
  }

  async updateChannel(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const existing = await service.getChannelById(req.params.id);
      if (!existing) throw new ApiError(404, "Channel not found");
      const channel = await service.updateChannel(req.params.id, req.body);
      return sendSuccess(res, channel, "Channel updated successfully");
    } catch (err) { next(err); }
  }

  async deleteChannel(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const existing = await service.getChannelById(req.params.id);
      if (!existing) throw new ApiError(404, "Channel not found");
      await service.deleteChannel(req.params.id);
      return sendSuccess(res, null, "Channel deleted successfully");
    } catch (err) { next(err); }
  }

  // ═══════════════════════════════════════════════════════
  // CONTACTS
  // ═══════════════════════════════════════════════════════

  /** GET /info-content/contacts — returns only active contacts (public) */
  async getActiveContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const contacts = await service.getActiveContacts();
      return sendSuccess(res, { count: contacts.length, contacts }, "Contacts retrieved successfully");
    } catch (err) { next(err); }
  }

  /** GET /info-content/contacts/all — returns all contacts (admin) */
  async getAllContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const contacts = await service.getAllContacts();
      return sendSuccess(res, { count: contacts.length, contacts }, "All contacts retrieved successfully");
    } catch (err) { next(err); }
  }

  async createContact(req: Request, res: Response, next: NextFunction) {
    try {
      const contact = await service.createContact(req.body);
      return sendSuccess(res, contact, "Contact created successfully", 201);
    } catch (err) { next(err); }
  }

  async updateContact(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const existing = await service.getContactById(req.params.id);
      if (!existing) throw new ApiError(404, "Contact not found");
      const contact = await service.updateContact(req.params.id, req.body);
      return sendSuccess(res, contact, "Contact updated successfully");
    } catch (err) { next(err); }
  }

  async deleteContact(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const existing = await service.getContactById(req.params.id);
      if (!existing) throw new ApiError(404, "Contact not found");
      await service.deleteContact(req.params.id);
      return sendSuccess(res, null, "Contact deleted successfully");
    } catch (err) { next(err); }
  }

  // ═══════════════════════════════════════════════════════
  // LINKS
  // ═══════════════════════════════════════════════════════

  /** GET /info-content/links — returns only active links (public) */
  async getActiveLinks(req: Request, res: Response, next: NextFunction) {
    try {
      const links = await service.getActiveLinks();
      return sendSuccess(res, { count: links.length, links }, "Links retrieved successfully");
    } catch (err) { next(err); }
  }

  /** GET /info-content/links/all — returns all links (admin) */
  async getAllLinks(req: Request, res: Response, next: NextFunction) {
    try {
      const links = await service.getAllLinks();
      return sendSuccess(res, { count: links.length, links }, "All links retrieved successfully");
    } catch (err) { next(err); }
  }

  async createLink(req: Request, res: Response, next: NextFunction) {
    try {
      const link = await service.createLink(req.body);
      return sendSuccess(res, link, "Link created successfully", 201);
    } catch (err) { next(err); }
  }

  async updateLink(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const existing = await service.getLinkById(req.params.id);
      if (!existing) throw new ApiError(404, "Link not found");
      const link = await service.updateLink(req.params.id, req.body);
      return sendSuccess(res, link, "Link updated successfully");
    } catch (err) { next(err); }
  }

  async deleteLink(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const existing = await service.getLinkById(req.params.id);
      if (!existing) throw new ApiError(404, "Link not found");
      await service.deleteLink(req.params.id);
      return sendSuccess(res, null, "Link deleted successfully");
    } catch (err) { next(err); }
  }
}

export const infoContentController = new InfoContentController();
