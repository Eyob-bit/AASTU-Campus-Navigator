import { PrismaClient } from "@prisma/client";
import { analyzeQueryIntent, type ChatIntent } from "../utils/intentDetector.js";
import { searchCampusKnowledge, type CampusMatchData } from "./campusKnowledge.service.js";
import { chatMemory, type SessionMemory } from "./chatMemory.service.js";
import { generateLLMResponse } from "./llm.service.js";

const prisma = new PrismaClient();

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
    floorId?: string;
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

export async function processChatMessage(
  message: string,
  sessionKey: string = "default_session"
): Promise<ChatResponsePayload> {
  const queryAnalysis = analyzeQueryIntent(message);
  const memory = chatMemory.getMemory(sessionKey);

  // ── Handle Follow-up Actions using Session Memory ────────────────────────
  if (queryAnalysis.isFollowUpNavigation && memory.lastEntranceLatitude && memory.lastEntranceLongitude) {
    const navResponse: ChatResponsePayload = {
      message: `Starting outdoor navigation to ${memory.lastOfficeName || memory.lastBuildingName || "destination"}.`,
      type: "general",
      confidence: 1.0,
      sessionKey,
      canNavigate: true,
      campusData: {
        buildingId: memory.lastBuildingId,
        buildingName: memory.lastBuildingName,
        officeId: memory.lastOfficeId,
        officeName: memory.lastOfficeName,
        floorId: memory.lastFloorId,
        floorNumber: memory.lastFloorNumber,
        roomNumber: memory.lastRoomNumber,
        staffName: memory.lastStaffName,
        entranceLatitude: memory.lastEntranceLatitude,
        entranceLongitude: memory.lastEntranceLongitude,
        entrySceneId: memory.lastEntrySceneId,
      },
      suggestions: ["Cancel Navigation", "Show on Map"],
      followUpChips: ["Show nearby buildings", "Show inside"],
      actionTrigger: {
        action: "START_NAVIGATION",
        payload: {
          name: memory.lastOfficeName || memory.lastBuildingName || "Destination",
          latitude: memory.lastEntranceLatitude,
          longitude: memory.lastEntranceLongitude,
          buildingId: memory.lastBuildingId,
          officeId: memory.lastOfficeId,
        },
      },
    };
    logChatQuery(sessionKey, message, "NAVIGATE", 1.0, memory.lastBuildingName, "navigation", true).catch(() => {});
    return navResponse;
  }

  if (queryAnalysis.isFollowUpInside && memory.lastEntrySceneId) {
    const panoramaResponse: ChatResponsePayload = {
      message: `Opening 360° indoor panorama view for ${memory.lastBuildingName || "building"}.`,
      type: "panorama",
      confidence: 1.0,
      sessionKey,
      canNavigate: true,
      campusData: {
        buildingId: memory.lastBuildingId,
        buildingName: memory.lastBuildingName,
        floorId: memory.lastFloorId,
        floorNumber: memory.lastFloorNumber,
        entrySceneId: memory.lastEntrySceneId,
      },
      suggestions: ["Start Navigation", "Show on Map"],
      followUpChips: ["Take me there", "View building details"],
      actionTrigger: {
        action: "OPEN_PANORAMA",
        payload: {
          sceneId: memory.lastEntrySceneId,
          buildingId: memory.lastBuildingId,
        },
      },
    };
    logChatQuery(sessionKey, message, "SHOW_INSIDE", 1.0, memory.lastBuildingName, "panorama", true).catch(() => {});
    return panoramaResponse;
  }

  if (queryAnalysis.isFollowUpMap && memory.lastEntranceLatitude && memory.lastEntranceLongitude) {
    const mapResponse: ChatResponsePayload = {
      message: `Centering campus map on ${memory.lastBuildingName || "location"}.`,
      type: "general",
      confidence: 1.0,
      sessionKey,
      canNavigate: true,
      campusData: {
        buildingId: memory.lastBuildingId,
        buildingName: memory.lastBuildingName,
        entranceLatitude: memory.lastEntranceLatitude,
        entranceLongitude: memory.lastEntranceLongitude,
      },
      suggestions: ["Start Navigation", "Show Inside"],
      followUpChips: ["Take me there", "Show inside"],
      actionTrigger: {
        action: "CENTER_MAP",
        payload: {
          latitude: memory.lastEntranceLatitude,
          longitude: memory.lastEntranceLongitude,
          buildingId: memory.lastBuildingId,
        },
      },
    };
    logChatQuery(sessionKey, message, "FIND_BUILDING", 1.0, memory.lastBuildingName, "map", true).catch(() => {});
    return mapResponse;
  }

  // ── Database Knowledge Search ──────────────────────────────────────────────
  const searchResult = await searchCampusKnowledge(queryAnalysis);

  // ── High Confidence Match (>85%) ──────────────────────────────────────────
  if (searchResult.match && searchResult.confidence >= 0.60) {
    const m = searchResult.match;

    // Update conversation memory
    chatMemory.updateMemory(sessionKey, {
      lastBuildingId: m.buildingId,
      lastBuildingName: m.buildingName,
      lastOfficeId: m.officeId,
      lastOfficeName: m.officeName || m.entityName,
      lastStaffId: m.staffId,
      lastStaffName: m.staffName,
      lastRoomNumber: m.roomNumber,
      lastFloorId: m.floorId,
      lastFloorNumber: m.floorNumber,
      lastEntranceLatitude: m.entranceLatitude,
      lastEntranceLongitude: m.entranceLongitude,
      lastEntrySceneId: m.entrySceneId,
      lastIntent: queryAnalysis.intent,
    });

    const llmMessage = await generateLLMResponse(message, {
      matchedType: m.entityType === "alias" ? "office" : m.entityType,
      entityName: m.entityName,
      buildingName: m.buildingName,
      buildingCode: m.buildingCode,
      floorNumber: m.floorNumber,
      roomNumber: m.roomNumber,
      position: m.position,
      description: m.description,
      confidence: searchResult.confidence,
    });

    const suggestions: string[] = ["Start Navigation", "Show on Map"];
    if (m.entrySceneId) suggestions.push("Show Inside");

    const followUpChips: string[] = ["Take me there", "Show nearby buildings"];
    if (m.roomNumber) followUpChips.push(`Where is Room ${m.roomNumber}?`);

    const responseType = m.entityType === "staff" ? "staff" : m.entityType === "building" ? "building" : "office";

    logChatQuery(sessionKey, message, queryAnalysis.intent, searchResult.confidence, m.entityName, responseType, true).catch(() => {});

    return {
      message: llmMessage,
      type: responseType,
      confidence: searchResult.confidence,
      sessionKey,
      campusData: {
        entityId: m.entityId,
        entityName: m.entityName,
        buildingId: m.buildingId,
        buildingName: m.buildingName,
        buildingCode: m.buildingCode,
        floorId: m.floorId,
        floorNumber: m.floorNumber,
        roomNumber: m.roomNumber,
        officeId: m.officeId,
        officeName: m.officeName,
        staffName: m.staffName,
        position: m.position,
        entranceLatitude: m.entranceLatitude,
        entranceLongitude: m.entranceLongitude,
        entrySceneId: m.entrySceneId,
      },
      canNavigate: Boolean(m.entranceLatitude && m.entranceLongitude),
      suggestions,
      followUpChips,
    };
  }

  // ── Ambiguous / Medium Confidence (40% - 60%) Clarification ─────────────────
  if (searchResult.clarificationCandidates.length > 0) {
    const llmMessage = await generateLLMResponse(message, {
      clarificationCandidates: searchResult.clarificationCandidates,
    });

    logChatQuery(sessionKey, message, queryAnalysis.intent, searchResult.confidence, null, "clarification", false).catch(() => {});

    return {
      message: llmMessage,
      type: "clarification",
      confidence: searchResult.confidence,
      sessionKey,
      canNavigate: false,
      suggestions: searchResult.clarificationCandidates.map((c) => `Where is ${c.name}?`),
      followUpChips: searchResult.clarificationCandidates.map((c) => c.name),
    };
  }

  // ── Low Confidence / General Information Fallback ──────────────────────────
  const generalLLMMessage = await generateLLMResponse(message);
  logChatQuery(sessionKey, message, queryAnalysis.intent, 0, null, "general", false).catch(() => {});

  return {
    message: generalLLMMessage,
    type: "general",
    confidence: 0,
    sessionKey,
    canNavigate: false,
    suggestions: ["Where is the Registrar?", "Where do I pay tuition?", "Show campus map"],
    followUpChips: ["Where is Block 12?", "Where is Main Library?"],
  };
}

async function logChatQuery(
  sessionKey: string,
  message: string,
  intent: string,
  confidence: number,
  matchedEntity: string | null | undefined,
  responseType: string,
  hasMatch: boolean
): Promise<void> {
  try {
    await prisma.chatLog.create({
      data: {
        sessionKey,
        message,
        intent,
        confidence,
        matchedEntity: matchedEntity || null,
        responseType,
        hasMatch,
      },
    });
  } catch (err) {
    console.warn("[Chat Log] Failed to log chat query:", err);
  }
}
