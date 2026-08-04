/**
 * Session-based Conversation Memory for AI Campus Assistant.
 * Maintains context for follow-up questions ("Take me there", "Show inside", "Show on map").
 */

export interface SessionMemory {
  sessionKey: string;
  lastBuildingId?: string;
  lastBuildingName?: string;
  lastOfficeId?: string;
  lastOfficeName?: string;
  lastStaffId?: string;
  lastStaffName?: string;
  lastRoomNumber?: string;
  lastFloorNumber?: number;
  lastEntranceLatitude?: number;
  lastEntranceLongitude?: number;
  lastEntrySceneId?: string;
  lastIntent?: string;
  updatedAt: number;
}

class MemoryStore {
  private memoryMap = new Map<string, SessionMemory>();

  getMemory(sessionKey: string): SessionMemory {
    const existing = this.memoryMap.get(sessionKey);
    if (existing) return existing;

    const newMemory: SessionMemory = {
      sessionKey,
      updatedAt: Date.now(),
    };
    this.memoryMap.set(sessionKey, newMemory);
    return newMemory;
  }

  updateMemory(sessionKey: string, updates: Partial<SessionMemory>): SessionMemory {
    const current = this.getMemory(sessionKey);
    const updated: SessionMemory = {
      ...current,
      ...updates,
      updatedAt: Date.now(),
    };
    this.memoryMap.set(sessionKey, updated);
    return updated;
  }

  clearMemory(sessionKey: string): void {
    this.memoryMap.delete(sessionKey);
  }
}

export const chatMemory = new MemoryStore();
