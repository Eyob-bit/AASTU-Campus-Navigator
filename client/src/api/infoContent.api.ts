import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InfoChannel {
  id: string;
  label: string;
  url: string;
  platform: string;
  colorClass: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface InfoContact {
  id: string;
  type: string; // "phone" | "email"
  label: string;
  value: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface InfoLink {
  id: string;
  label: string;
  url: string;
  iconName: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ── Channel API ───────────────────────────────────────────────────────────────

async function getActiveChannels(): Promise<InfoChannel[]> {
  const data = await apiGet<{ channels: InfoChannel[] }>("/info-content/channels");
  return data.channels ?? [];
}

async function getAllChannels(): Promise<InfoChannel[]> {
  const data = await apiGet<{ channels: InfoChannel[] }>("/info-content/channels/all");
  return data.channels ?? [];
}

async function createChannel(payload: Omit<InfoChannel, "id" | "createdAt" | "updatedAt">): Promise<InfoChannel> {
  return apiPost<InfoChannel>("/info-content/channels", payload);
}

async function updateChannel(id: string, payload: Partial<Omit<InfoChannel, "id" | "createdAt" | "updatedAt">>): Promise<InfoChannel> {
  return apiPatch<InfoChannel>(`/info-content/channels/${id}`, payload);
}

async function deleteChannel(id: string): Promise<void> {
  await apiDelete(`/info-content/channels/${id}`);
}

// ── Contact API ───────────────────────────────────────────────────────────────

async function getActiveContacts(): Promise<InfoContact[]> {
  const data = await apiGet<{ contacts: InfoContact[] }>("/info-content/contacts");
  return data.contacts ?? [];
}

async function getAllContacts(): Promise<InfoContact[]> {
  const data = await apiGet<{ contacts: InfoContact[] }>("/info-content/contacts/all");
  return data.contacts ?? [];
}

async function createContact(payload: Omit<InfoContact, "id" | "createdAt" | "updatedAt">): Promise<InfoContact> {
  return apiPost<InfoContact>("/info-content/contacts", payload);
}

async function updateContact(id: string, payload: Partial<Omit<InfoContact, "id" | "createdAt" | "updatedAt">>): Promise<InfoContact> {
  return apiPatch<InfoContact>(`/info-content/contacts/${id}`, payload);
}

async function deleteContact(id: string): Promise<void> {
  await apiDelete(`/info-content/contacts/${id}`);
}

// ── Link API ──────────────────────────────────────────────────────────────────

async function getActiveLinks(): Promise<InfoLink[]> {
  const data = await apiGet<{ links: InfoLink[] }>("/info-content/links");
  return data.links ?? [];
}

async function getAllLinks(): Promise<InfoLink[]> {
  const data = await apiGet<{ links: InfoLink[] }>("/info-content/links/all");
  return data.links ?? [];
}

async function createLink(payload: Omit<InfoLink, "id" | "createdAt" | "updatedAt">): Promise<InfoLink> {
  return apiPost<InfoLink>("/info-content/links", payload);
}

async function updateLink(id: string, payload: Partial<Omit<InfoLink, "id" | "createdAt" | "updatedAt">>): Promise<InfoLink> {
  return apiPatch<InfoLink>(`/info-content/links/${id}`, payload);
}

async function deleteLink(id: string): Promise<void> {
  await apiDelete(`/info-content/links/${id}`);
}

// ── Export ────────────────────────────────────────────────────────────────────

export const infoContentApi = {
  getActiveChannels,
  getAllChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  getActiveContacts,
  getAllContacts,
  createContact,
  updateContact,
  deleteContact,
  getActiveLinks,
  getAllLinks,
  createLink,
  updateLink,
  deleteLink,
};
