import { prisma } from "../config/prisma.js";
import { ConnectionType } from "@prisma/client";

export class ComplexRepository {
    async findAll() {
        return prisma.buildingComplex.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
            include: {
                blocks: {
                    where: { isActive: true },
                    include: {
                        entrances: {
                            include: { roadNode: true },
                        },
                    },
                },
                connections: {
                    include: {
                        fromBuilding: true,
                        toBuilding: true,
                        fromFloor: true,
                        toFloor: true,
                    },
                },
            },
        });
    }

    async findById(id: string) {
        return prisma.buildingComplex.findUnique({
            where: { id },
            include: {
                blocks: {
                    where: { isActive: true },
                    include: {
                        entrances: {
                            include: { roadNode: true },
                        },
                        floors: {
                            orderBy: { floorNumber: "asc" },
                        },
                    },
                },
                connections: {
                    include: {
                        fromBuilding: true,
                        toBuilding: true,
                        fromFloor: true,
                        toFloor: true,
                        fromScene: true,
                        toScene: true,
                    },
                },
            },
        });
    }

    async findByCode(code: string) {
        return prisma.buildingComplex.findUnique({
            where: { code },
        });
    }

    async create(data: {
        name: string;
        code: string;
        description?: string;
        zone?: string;
        coverImage?: string;
    }) {
        return prisma.buildingComplex.create({
            data: {
                name: data.name,
                code: data.code.toUpperCase(),
                description: data.description,
                zone: data.zone,
                coverImage: data.coverImage,
            },
        });
    }

    async update(
        id: string,
        data: {
            name?: string;
            code?: string;
            description?: string;
            zone?: string;
            coverImage?: string;
            isActive?: boolean;
        }
    ) {
        return prisma.buildingComplex.update({
            where: { id },
            data: {
                ...data,
                ...(data.code ? { code: data.code.toUpperCase() } : {}),
            },
        });
    }

    async delete(id: string) {
        return prisma.buildingComplex.update({
            where: { id },
            data: { isActive: false },
        });
    }

    // ── Block Connections ──────────────────────────────────────────────────────
    async findAllConnections(complexId?: string) {
        return prisma.blockConnection.findMany({
            where: complexId ? { complexId } : {},
            include: {
                fromBuilding: true,
                toBuilding: true,
                fromFloor: true,
                toFloor: true,
                fromScene: true,
                toScene: true,
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async createConnection(data: {
        name: string;
        type?: ConnectionType;
        fromBuildingId: string;
        toBuildingId: string;
        fromFloorId?: string | null;
        toFloorId?: string | null;
        fromSceneId?: string | null;
        toSceneId?: string | null;
        description?: string | null;
        isWalkable?: boolean;
        complexId?: string | null;
    }) {
        return prisma.blockConnection.create({
            data: {
                name: data.name,
                type: data.type || ConnectionType.BRIDGE,
                fromBuildingId: data.fromBuildingId,
                toBuildingId: data.toBuildingId,
                fromFloorId: data.fromFloorId,
                toFloorId: data.toFloorId,
                fromSceneId: data.fromSceneId,
                toSceneId: data.toSceneId,
                description: data.description,
                isWalkable: data.isWalkable ?? true,
                complexId: data.complexId,
            },
            include: {
                fromBuilding: true,
                toBuilding: true,
                fromFloor: true,
                toFloor: true,
                fromScene: true,
                toScene: true,
            },
        });
    }

    async deleteConnection(id: string) {
        return prisma.blockConnection.delete({
            where: { id },
        });
    }
}
