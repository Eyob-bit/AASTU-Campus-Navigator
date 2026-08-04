import { prisma } from "../config/prisma.js";

// ── InfoChannel ──────────────────────────────────────────────────────────────

export interface CreateInfoChannelData {
  label: string;
  url: string;
  platform?: string;
  colorClass?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateInfoChannelData extends Partial<CreateInfoChannelData> {}

// ── InfoContact ──────────────────────────────────────────────────────────────

export interface CreateInfoContactData {
  type?: string;
  label: string;
  value: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateInfoContactData extends Partial<CreateInfoContactData> {}

// ── InfoLink ─────────────────────────────────────────────────────────────────

export interface CreateInfoLinkData {
  label: string;
  url: string;
  iconName?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateInfoLinkData extends Partial<CreateInfoLinkData> {}

// ── Repository ────────────────────────────────────────────────────────────────

export class InfoContentRepository {
  // ── Channels ──
  async findAllChannels() {
    return prisma.infoChannel.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  }

  async findActiveChannels() {
    return prisma.infoChannel.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  async findChannelById(id: string) {
    return prisma.infoChannel.findUnique({ where: { id } });
  }

  async createChannel(data: CreateInfoChannelData) {
    return prisma.infoChannel.create({ data });
  }

  async updateChannel(id: string, data: UpdateInfoChannelData) {
    return prisma.infoChannel.update({ where: { id }, data });
  }

  async deleteChannel(id: string) {
    return prisma.infoChannel.delete({ where: { id } });
  }

  // ── Contacts ──
  async findAllContacts() {
    return prisma.infoContact.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  }

  async findActiveContacts() {
    return prisma.infoContact.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  async findContactById(id: string) {
    return prisma.infoContact.findUnique({ where: { id } });
  }

  async createContact(data: CreateInfoContactData) {
    return prisma.infoContact.create({ data });
  }

  async updateContact(id: string, data: UpdateInfoContactData) {
    return prisma.infoContact.update({ where: { id }, data });
  }

  async deleteContact(id: string) {
    return prisma.infoContact.delete({ where: { id } });
  }

  // ── Links ──
  async findAllLinks() {
    return prisma.infoLink.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  }

  async findActiveLinks() {
    return prisma.infoLink.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  async findLinkById(id: string) {
    return prisma.infoLink.findUnique({ where: { id } });
  }

  async createLink(data: CreateInfoLinkData) {
    return prisma.infoLink.create({ data });
  }

  async updateLink(id: string, data: UpdateInfoLinkData) {
    return prisma.infoLink.update({ where: { id }, data });
  }

  async deleteLink(id: string) {
    return prisma.infoLink.delete({ where: { id } });
  }
}
