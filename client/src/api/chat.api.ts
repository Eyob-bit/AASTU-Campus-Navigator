import { apiClient } from "./client";

export interface ChatMessageRequest {
  message: string;
  sessionKey?: string;
}

export interface ChatResponsePayload {
  message: string;
  type: "building" | "office" | "staff" | "panorama" | "general" | "clarification";
  confidence: number;
  sessionKey: string;
  campusData?: {
    entityId?: string;
    entityName?: string;
    buildingId?: string;
    buildingName?: string;
    buildingCode?: string;
    floorNumber?: number;
    roomNumber?: string;
    officeId?: string;
    officeName?: string;
    staffName?: string;
    position?: string;
    entranceLatitude?: number;
    entranceLongitude?: number;
    entrySceneId?: string;
  };
  canNavigate: boolean;
  suggestions: string[];
  followUpChips: string[];
  actionTrigger?: {
    action: "START_NAVIGATION" | "CENTER_MAP" | "OPEN_PANORAMA" | "VIEW_BUILDING";
    payload: Record<string, unknown>;
  };
}

export const chatApi = {
  async sendMessage(data: ChatMessageRequest): Promise<ChatResponsePayload> {
    const res = await apiClient.post<ChatResponsePayload>("/chat", data);
    return res.data;
  },
};
