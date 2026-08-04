import { InfoContentRepository } from "../repositories/infoContent.repository.js";
import type {
  CreateInfoChannelData,
  UpdateInfoChannelData,
  CreateInfoContactData,
  UpdateInfoContactData,
  CreateInfoLinkData,
  UpdateInfoLinkData,
} from "../repositories/infoContent.repository.js";

const repo = new InfoContentRepository();

export class InfoContentService {
  // ── Channels ──
  getAllChannels()    { return repo.findAllChannels(); }
  getActiveChannels() { return repo.findActiveChannels(); }
  getChannelById(id: string) { return repo.findChannelById(id); }
  createChannel(data: CreateInfoChannelData) { return repo.createChannel(data); }
  updateChannel(id: string, data: UpdateInfoChannelData) { return repo.updateChannel(id, data); }
  deleteChannel(id: string) { return repo.deleteChannel(id); }

  // ── Contacts ──
  getAllContacts()    { return repo.findAllContacts(); }
  getActiveContacts() { return repo.findActiveContacts(); }
  getContactById(id: string) { return repo.findContactById(id); }
  createContact(data: CreateInfoContactData) { return repo.createContact(data); }
  updateContact(id: string, data: UpdateInfoContactData) { return repo.updateContact(id, data); }
  deleteContact(id: string) { return repo.deleteContact(id); }

  // ── Links ──
  getAllLinks()    { return repo.findAllLinks(); }
  getActiveLinks() { return repo.findActiveLinks(); }
  getLinkById(id: string) { return repo.findLinkById(id); }
  createLink(data: CreateInfoLinkData) { return repo.createLink(data); }
  updateLink(id: string, data: UpdateInfoLinkData) { return repo.updateLink(id, data); }
  deleteLink(id: string) { return repo.deleteLink(id); }
}
