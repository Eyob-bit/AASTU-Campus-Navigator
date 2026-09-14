import { prisma } from "../config/prisma.js";
import { RoadNodeType, LandmarkCategory, ConnectionType } from "@prisma/client";

export interface CampusDataset {
    complexes?: Array<{
        code: string;
        name: string;
        description?: string;
        zone?: string;
        coverImage?: string;
    }>;
    buildings?: Array<{
        code: string;
        name: string;
        complexCode?: string;
        entranceLatitude: number;
        entranceLongitude: number;
        entranceRoadNodeId?: string;
        entranceImage?: string;
        coverImage?: string;
        zone?: string;
    }>;
    entrances?: Array<{
        buildingCode: string;
        name: string;
        latitude: number;
        longitude: number;
        roadNodeId?: string;
        isPrimary?: boolean;
    }>;
    floors?: Array<{
        buildingCode: string;
        floorNumber: number;
    }>;
    offices?: Array<{
        buildingCode: string;
        floorNumber: number;
        roomNumber: string;
        name: string;
        description?: string;
    }>;
    staff?: Array<{
        fullName: string;
        position: string;
        email?: string;
        phone?: string;
        buildingCode: string;
        floorNumber: number;
        roomNumber: string;
    }>;
    landmarks?: Array<{
        name: string;
        category?: string;
        latitude: number;
        longitude: number;
        description?: string;
        buildingCode?: string;
        roadNodeId?: string;
    }>;
    roadNodes?: Array<{
        id?: string;
        name?: string;
        type?: string;
        latitude: number;
        longitude: number;
        zone?: string;
    }>;
    roadEdges?: Array<{
        fromNodeId: string;
        toNodeId: string;
        distance?: number;
        isBidirectional?: boolean;
        isWalkable?: boolean;
    }>;
    aliases?: Array<{
        alias: string;
        staffFullName?: string;
        roomNumber?: string;
        buildingCode?: string;
    }>;
    connections?: Array<{
        name: string;
        type?: string;
        fromBuildingCode: string;
        toBuildingCode: string;
        fromFloorNumber?: number;
        toFloorNumber?: number;
        description?: string;
    }>;
}

export interface ValidationReport {
    valid: boolean;
    counts: Record<string, number>;
    errors: string[];
    warnings: string[];
}

export class BulkImportService {
    /**
     * Validates an arbitrary dataset payload before touching the database.
     */
    validateDataset(raw: unknown): ValidationReport {
        const errors: string[] = [];
        const warnings: string[] = [];
        const counts: Record<string, number> = {};

        if (!raw || typeof raw !== "object") {
            return {
                valid: false,
                counts: {},
                errors: ["Payload must be a JSON object containing dataset collections."],
                warnings: [],
            };
        }

        const data = raw as CampusDataset;

        // 1. Complexes
        if (data.complexes) {
            if (!Array.isArray(data.complexes)) errors.push("complexes must be an array");
            else {
                counts.complexes = data.complexes.length;
                data.complexes.forEach((c, idx) => {
                    if (!c.code?.trim()) errors.push(`complexes[${idx}]: missing code`);
                    if (!c.name?.trim()) errors.push(`complexes[${idx}]: missing name`);
                });
            }
        }

        // 2. Buildings
        if (data.buildings) {
            if (!Array.isArray(data.buildings)) errors.push("buildings must be an array");
            else {
                counts.buildings = data.buildings.length;
                data.buildings.forEach((b, idx) => {
                    if (!b.code?.trim()) errors.push(`buildings[${idx}]: missing code`);
                    if (!b.name?.trim()) errors.push(`buildings[${idx}]: missing name`);
                    if (typeof b.entranceLatitude !== "number") errors.push(`buildings[${idx}]: entranceLatitude must be a number`);
                    if (typeof b.entranceLongitude !== "number") errors.push(`buildings[${idx}]: entranceLongitude must be a number`);
                });
            }
        }

        // 3. Entrances
        if (data.entrances) {
            if (!Array.isArray(data.entrances)) errors.push("entrances must be an array");
            else {
                counts.entrances = data.entrances.length;
                data.entrances.forEach((e, idx) => {
                    if (!e.buildingCode?.trim()) errors.push(`entrances[${idx}]: missing buildingCode`);
                    if (!e.name?.trim()) errors.push(`entrances[${idx}]: missing name`);
                    if (typeof e.latitude !== "number") errors.push(`entrances[${idx}]: latitude must be a number`);
                    if (typeof e.longitude !== "number") errors.push(`entrances[${idx}]: longitude must be a number`);
                });
            }
        }

        // 4. Floors
        if (data.floors) {
            if (!Array.isArray(data.floors)) errors.push("floors must be an array");
            else {
                counts.floors = data.floors.length;
                data.floors.forEach((f, idx) => {
                    if (!f.buildingCode?.trim()) errors.push(`floors[${idx}]: missing buildingCode`);
                    if (typeof f.floorNumber !== "number") errors.push(`floors[${idx}]: floorNumber must be a number`);
                });
            }
        }

        // 5. Offices
        if (data.offices) {
            if (!Array.isArray(data.offices)) errors.push("offices must be an array");
            else {
                counts.offices = data.offices.length;
                data.offices.forEach((o, idx) => {
                    if (!o.buildingCode?.trim()) errors.push(`offices[${idx}]: missing buildingCode`);
                    if (typeof o.floorNumber !== "number") errors.push(`offices[${idx}]: floorNumber must be a number`);
                    if (!o.roomNumber?.trim()) errors.push(`offices[${idx}]: missing roomNumber`);
                    if (!o.name?.trim()) errors.push(`offices[${idx}]: missing name`);
                });
            }
        }

        // 6. Staff
        if (data.staff) {
            if (!Array.isArray(data.staff)) errors.push("staff must be an array");
            else {
                counts.staff = data.staff.length;
                data.staff.forEach((s, idx) => {
                    if (!s.fullName?.trim()) errors.push(`staff[${idx}]: missing fullName`);
                    if (!s.position?.trim()) errors.push(`staff[${idx}]: missing position`);
                    if (!s.buildingCode?.trim()) errors.push(`staff[${idx}]: missing buildingCode`);
                    if (!s.roomNumber?.trim()) errors.push(`staff[${idx}]: missing roomNumber`);
                });
            }
        }

        // 7. Road Nodes & Edges
        if (data.roadNodes) counts.roadNodes = data.roadNodes.length;
        if (data.roadEdges) counts.roadEdges = data.roadEdges.length;
        if (data.landmarks) counts.landmarks = data.landmarks.length;
        if (data.connections) counts.connections = data.connections.length;
        if (data.aliases) counts.aliases = data.aliases.length;

        return {
            valid: errors.length === 0,
            counts,
            errors,
            warnings,
        };
    }

    /**
     * Atomically ingests validated dataset into the database.
     */
    async importDataset(raw: unknown) {
        const validation = this.validateDataset(raw);
        if (!validation.valid) {
            throw new Error(`Dataset validation failed: ${validation.errors.join("; ")}`);
        }

        const data = raw as CampusDataset;
        const results: Record<string, number> = {};

        // Ingest inside an interactive transaction to maintain referential integrity
        await prisma.$transaction(async (tx) => {
            const complexMap = new Map<string, string>(); // code -> id
            const buildingMap = new Map<string, string>(); // code -> id
            const floorMap = new Map<string, string>(); // "buildingCode:floorNumber" -> id
            const officeMap = new Map<string, string>(); // "buildingCode:floorNumber:roomNumber" -> id

            // 1. Complexes
            if (data.complexes) {
                for (const c of data.complexes) {
                    const rec = await tx.buildingComplex.upsert({
                        where: { code: c.code.toUpperCase() },
                        create: {
                            name: c.name,
                            code: c.code.toUpperCase(),
                            description: c.description,
                            zone: c.zone,
                            coverImage: c.coverImage,
                        },
                        update: {
                            name: c.name,
                            description: c.description,
                            zone: c.zone,
                            coverImage: c.coverImage,
                        },
                    });
                    complexMap.set(c.code.toUpperCase(), rec.id);
                }
                results.complexes = data.complexes.length;
            }

            // 2. Buildings / Blocks
            if (data.buildings) {
                for (const b of data.buildings) {
                    const complexId = b.complexCode ? complexMap.get(b.complexCode.toUpperCase()) || null : null;
                    const rec = await tx.building.upsert({
                        where: { code: b.code.toUpperCase() },
                        create: {
                            name: b.name,
                            code: b.code.toUpperCase(),
                            entranceLatitude: b.entranceLatitude,
                            entranceLongitude: b.entranceLongitude,
                            entranceRoadNodeId: b.entranceRoadNodeId || null,
                            entranceImage: b.entranceImage,
                            coverImage: b.coverImage,
                            zone: b.zone,
                            complexId,
                        },
                        update: {
                            name: b.name,
                            entranceLatitude: b.entranceLatitude,
                            entranceLongitude: b.entranceLongitude,
                            entranceRoadNodeId: b.entranceRoadNodeId || null,
                            entranceImage: b.entranceImage,
                            coverImage: b.coverImage,
                            zone: b.zone,
                            complexId,
                        },
                    });
                    buildingMap.set(b.code.toUpperCase(), rec.id);
                }
                results.buildings = data.buildings.length;
            }

            // 3. Entrances
            if (data.entrances) {
                for (const e of data.entrances) {
                    const buildingId = buildingMap.get(e.buildingCode.toUpperCase());
                    if (buildingId) {
                        await tx.buildingEntrance.create({
                            data: {
                                name: e.name,
                                buildingId,
                                latitude: e.latitude,
                                longitude: e.longitude,
                                roadNodeId: e.roadNodeId || null,
                                isPrimary: e.isPrimary ?? false,
                            },
                        });
                    }
                }
                results.entrances = data.entrances.length;
            }

            // 4. Floors
            if (data.floors) {
                for (const f of data.floors) {
                    const buildingId = buildingMap.get(f.buildingCode.toUpperCase());
                    if (buildingId) {
                        const rec = await tx.floor.upsert({
                            where: {
                                buildingId_floorNumber: {
                                    buildingId,
                                    floorNumber: f.floorNumber,
                                },
                            },
                            create: {
                                buildingId,
                                floorNumber: f.floorNumber,
                            },
                            update: {},
                        });
                        floorMap.set(`${f.buildingCode.toUpperCase()}:${f.floorNumber}`, rec.id);
                    }
                }
                results.floors = data.floors.length;
            }

            // 5. Offices
            if (data.offices) {
                for (const o of data.offices) {
                    const floorId = floorMap.get(`${o.buildingCode.toUpperCase()}:${o.floorNumber}`);
                    if (floorId) {
                        const rec = await tx.office.upsert({
                            where: {
                                floorId_roomNumber: {
                                    floorId,
                                    roomNumber: o.roomNumber,
                                },
                            },
                            create: {
                                floorId,
                                roomNumber: o.roomNumber,
                                name: o.name,
                                description: o.description,
                            },
                            update: {
                                name: o.name,
                                description: o.description,
                            },
                        });
                        officeMap.set(`${o.buildingCode.toUpperCase()}:${o.floorNumber}:${o.roomNumber}`, rec.id);
                    }
                }
                results.offices = data.offices.length;
            }

            // 6. Staff
            if (data.staff) {
                for (const s of data.staff) {
                    const officeId = officeMap.get(`${s.buildingCode.toUpperCase()}:${s.floorNumber}:${s.roomNumber}`);
                    if (officeId) {
                        await tx.staff.create({
                            data: {
                                fullName: s.fullName,
                                position: s.position,
                                email: s.email,
                                phone: s.phone,
                                officeId,
                            },
                        });
                    }
                }
                results.staff = data.staff.length;
            }

            // 7. Connections (Bridges / Walkways)
            if (data.connections) {
                for (const conn of data.connections) {
                    const fromBuildingId = buildingMap.get(conn.fromBuildingCode.toUpperCase());
                    const toBuildingId = buildingMap.get(conn.toBuildingCode.toUpperCase());
                    if (fromBuildingId && toBuildingId) {
                        const fromFloorId = conn.fromFloorNumber !== undefined
                            ? floorMap.get(`${conn.fromBuildingCode.toUpperCase()}:${conn.fromFloorNumber}`) || null
                            : null;
                        const toFloorId = conn.toFloorNumber !== undefined
                            ? floorMap.get(`${conn.toBuildingCode.toUpperCase()}:${conn.toFloorNumber}`) || null
                            : null;

                        await tx.blockConnection.create({
                            data: {
                                name: conn.name,
                                type: (conn.type as ConnectionType) || ConnectionType.BRIDGE,
                                fromBuildingId,
                                toBuildingId,
                                fromFloorId,
                                toFloorId,
                                description: conn.description,
                            },
                        });
                    }
                }
                results.connections = data.connections.length;
            }
        });

        return {
            success: true,
            importedCounts: results,
        };
    }
}
