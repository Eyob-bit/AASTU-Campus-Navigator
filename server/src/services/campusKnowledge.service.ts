import { prisma } from "../config/prisma.js";
import { calculateSimilarity, type NormalizedQuery } from "../utils/intentDetector.js";

export interface CampusMatchData {
  entityType: "alias" | "staff" | "office" | "building" | "panorama";
  entityId: string;
  entityName: string;
  buildingId?: string;
  buildingName?: string;
  buildingCode?: string;
  floorId?: string;
  floorNumber?: number;
  roomNumber?: string;
  officeId?: string;
  officeName?: string;
  staffId?: string;
  staffName?: string;
  position?: string;
  description?: string;
  entranceLatitude?: number;
  entranceLongitude?: number;
  entrySceneId?: string;
}

export interface CampusSearchResult {
  match?: CampusMatchData;
  confidence: number; // 0.0 to 1.0
  matchedType: "alias" | "staff" | "office" | "building" | "panorama" | "none";
  clarificationCandidates: Array<{ name: string; type: string; details?: string }>;
}

async function resolveEntrySceneId(floorId?: string, buildingId?: string): Promise<string | undefined> {
  if (floorId) {
    const fEntry = await prisma.panoramaScene.findFirst({
      where: { floorId, isEntryScene: true },
      select: { id: true },
    });
    if (fEntry) return fEntry.id;

    const fAny = await prisma.panoramaScene.findFirst({
      where: { floorId },
      orderBy: { displayOrder: "asc" },
      select: { id: true },
    });
    if (fAny) return fAny.id;
  }

  if (buildingId) {
    const bEntry = await prisma.panoramaScene.findFirst({
      where: { floor: { buildingId }, isEntryScene: true },
      select: { id: true },
    });
    if (bEntry) return bEntry.id;

    const bAny = await prisma.panoramaScene.findFirst({
      where: { floor: { buildingId } },
      orderBy: { displayOrder: "asc" },
      select: { id: true },
    });
    if (bAny) return bAny.id;
  }

  const globalDefault = await prisma.panoramaScene.findFirst({
    orderBy: [{ isEntryScene: "desc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  return globalDefault?.id;
}

export async function searchCampusKnowledge(query: NormalizedQuery): Promise<CampusSearchResult> {
  const { normalized, raw, tokens } = query;
  if (!normalized) {
    return { confidence: 0, matchedType: "none", clarificationCandidates: [] };
  }

  // ── 1. Search Aliases (Highest Priority) ──────────────────────────────────
  const aliases = await prisma.searchAlias.findMany({
    include: {
      office: {
        include: {
          floor: {
            include: {
              building: true,
            },
          },
        },
      },
      staff: {
        include: {
          office: {
            include: {
              floor: {
                include: {
                  building: true,
                },
              },
            },
          },
        },
      },
    },
  });

  let bestAliasMatch: { aliasObj: (typeof aliases)[0]; score: number } | null = null;
  for (const item of aliases) {
    const score = Math.max(
      calculateSimilarity(normalized, item.normalizedAlias),
      calculateSimilarity(normalized, item.alias),
      ...tokens.map((t) => calculateSimilarity(t, item.normalizedAlias))
    );

    if (score > 0.45 && (!bestAliasMatch || score > bestAliasMatch.score)) {
      bestAliasMatch = { aliasObj: item, score };
    }
  }

  if (bestAliasMatch && bestAliasMatch.score >= 0.70) {
    const item = bestAliasMatch.aliasObj;
    if (item.office) {
      const b = item.office.floor.building;
      const entrySceneId = await resolveEntrySceneId(item.office.floor.id, b.id);

      return {
        confidence: bestAliasMatch.score,
        matchedType: "alias",
        match: {
          entityType: "office",
          entityId: item.office.id,
          entityName: item.office.name,
          officeId: item.office.id,
          officeName: item.office.name,
          roomNumber: item.office.roomNumber,
          description: item.office.description || undefined,
          buildingId: b.id,
          buildingName: b.name,
          buildingCode: b.code,
          floorId: item.office.floor.id,
          floorNumber: item.office.floor.floorNumber,
          entranceLatitude: b.entranceLatitude,
          entranceLongitude: b.entranceLongitude,
          entrySceneId,
        },
        clarificationCandidates: [],
      };
    }

    if (item.staff) {
      const off = item.staff.office;
      const b = off.floor.building;
      const entrySceneId = await resolveEntrySceneId(off.floor.id, b.id);

      return {
        confidence: bestAliasMatch.score,
        matchedType: "alias",
        match: {
          entityType: "staff",
          entityId: item.staff.id,
          entityName: item.staff.fullName,
          staffId: item.staff.id,
          staffName: item.staff.fullName,
          position: item.staff.position,
          officeId: off.id,
          officeName: off.name,
          roomNumber: off.roomNumber,
          buildingId: b.id,
          buildingName: b.name,
          buildingCode: b.code,
          floorId: off.floor.id,
          floorNumber: off.floor.floorNumber,
          entranceLatitude: b.entranceLatitude,
          entranceLongitude: b.entranceLongitude,
          entrySceneId,
        },
        clarificationCandidates: [],
      };
    }
  }

  // ── 2. Search Staff (Person / Role) ───────────────────────────────────────
  const staffMembers = await prisma.staff.findMany({
    where: { isActive: true },
    include: {
      office: {
        include: {
          floor: {
            include: {
              building: true,
            },
          },
        },
      },
    },
  });

  let bestStaffMatch: { staff: (typeof staffMembers)[0]; score: number } | null = null;
  for (const st of staffMembers) {
    const score = Math.max(
      calculateSimilarity(normalized, st.fullName),
      calculateSimilarity(normalized, st.position),
      ...tokens.map((t) => Math.max(calculateSimilarity(t, st.fullName), calculateSimilarity(t, st.position)))
    );

    if (score > 0.40 && (!bestStaffMatch || score > bestStaffMatch.score)) {
      bestStaffMatch = { staff: st, score };
    }
  }

  if (bestStaffMatch && bestStaffMatch.score >= 0.70) {
    const st = bestStaffMatch.staff;
    const off = st.office;
    const b = off.floor.building;
    const entrySceneId = await resolveEntrySceneId(off.floor.id, b.id);

    return {
      confidence: bestStaffMatch.score,
      matchedType: "staff",
      match: {
        entityType: "staff",
        entityId: st.id,
        entityName: st.fullName,
        staffId: st.id,
        staffName: st.fullName,
        position: st.position,
        officeId: off.id,
        officeName: off.name,
        roomNumber: off.roomNumber,
        buildingId: b.id,
        buildingName: b.name,
        buildingCode: b.code,
        floorId: off.floor.id,
        floorNumber: off.floor.floorNumber,
        entranceLatitude: b.entranceLatitude,
        entranceLongitude: b.entranceLongitude,
        entrySceneId,
      },
      clarificationCandidates: [],
    };
  }

  // ── 3. Search Offices (Office / Room Number) ──────────────────────────────
  const offices = await prisma.office.findMany({
    where: { isActive: true },
    include: {
      floor: {
        include: {
          building: true,
        },
      },
    },
  });

  let bestOfficeMatch: { office: (typeof offices)[0]; score: number } | null = null;
  for (const off of offices) {
    const score = Math.max(
      calculateSimilarity(normalized, off.name),
      calculateSimilarity(normalized, `room ${off.roomNumber}`),
      calculateSimilarity(normalized, off.roomNumber),
      off.description ? calculateSimilarity(normalized, off.description) * 0.8 : 0,
      ...tokens.map((t) => calculateSimilarity(t, off.name))
    );

    if (score > 0.40 && (!bestOfficeMatch || score > bestOfficeMatch.score)) {
      bestOfficeMatch = { office: off, score };
    }
  }

  if (bestOfficeMatch && bestOfficeMatch.score >= 0.65) {
    const off = bestOfficeMatch.office;
    const b = off.floor.building;
    const entrySceneId = await resolveEntrySceneId(off.floor.id, b.id);

    return {
      confidence: bestOfficeMatch.score,
      matchedType: "office",
      match: {
        entityType: "office",
        entityId: off.id,
        entityName: off.name,
        officeId: off.id,
        officeName: off.name,
        roomNumber: off.roomNumber,
        description: off.description || undefined,
        buildingId: b.id,
        buildingName: b.name,
        buildingCode: b.code,
        floorId: off.floor.id,
        floorNumber: off.floor.floorNumber,
        entranceLatitude: b.entranceLatitude,
        entranceLongitude: b.entranceLongitude,
        entrySceneId,
      },
      clarificationCandidates: [],
    };
  }

  // ── 4. Search Buildings (Building / Block / Zone) ──────────────────────────
  const buildings = await prisma.building.findMany({
    where: { isActive: true },
  });

  let bestBuildingMatch: { building: (typeof buildings)[0]; score: number } | null = null;
  for (const b of buildings) {
    const score = Math.max(
      calculateSimilarity(normalized, b.name),
      calculateSimilarity(normalized, b.code),
      b.zone ? calculateSimilarity(normalized, b.zone) * 0.8 : 0,
      ...tokens.map((t) => Math.max(calculateSimilarity(t, b.name), calculateSimilarity(t, b.code)))
    );

    if (score > 0.35 && (!bestBuildingMatch || score > bestBuildingMatch.score)) {
      bestBuildingMatch = { building: b, score };
    }
  }

  if (bestBuildingMatch && bestBuildingMatch.score >= 0.60) {
    const b = bestBuildingMatch.building;
    const entrySceneId = await resolveEntrySceneId(undefined, b.id);

    return {
      confidence: bestBuildingMatch.score,
      matchedType: "building",
      match: {
        entityType: "building",
        entityId: b.id,
        entityName: b.name,
        buildingId: b.id,
        buildingName: b.name,
        buildingCode: b.code,
        entranceLatitude: b.entranceLatitude,
        entranceLongitude: b.entranceLongitude,
        entrySceneId,
      },
      clarificationCandidates: [],
    };
  }

  // ── 5. Ambiguous / Low-confidence candidates check (40-65%) ─────────────────
  const candidates: Array<{ name: string; type: string; details?: string }> = [];
  if (bestOfficeMatch && bestOfficeMatch.score >= 0.40) {
    candidates.push({
      name: bestOfficeMatch.office.name,
      type: "Office",
      details: `${bestOfficeMatch.office.floor.building.name}, Room ${bestOfficeMatch.office.roomNumber}`,
    });
  }
  if (bestStaffMatch && bestStaffMatch.score >= 0.40) {
    candidates.push({
      name: bestStaffMatch.staff.fullName,
      type: "Staff",
      details: `${bestStaffMatch.staff.position} - ${bestStaffMatch.staff.office.name}`,
    });
  }
  if (bestBuildingMatch && bestBuildingMatch.score >= 0.40) {
    candidates.push({
      name: bestBuildingMatch.building.name,
      type: "Building",
      details: `Block Code: ${bestBuildingMatch.building.code}`,
    });
  }

  const maxConfidence = Math.max(
    bestAliasMatch?.score || 0,
    bestStaffMatch?.score || 0,
    bestOfficeMatch?.score || 0,
    bestBuildingMatch?.score || 0
  );

  return {
    confidence: maxConfidence,
    matchedType: "none",
    clarificationCandidates: candidates.slice(0, 3),
  };
}
