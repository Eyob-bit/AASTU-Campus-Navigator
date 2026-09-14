import { prisma } from "../config/prisma.js";

export class BuildingRepository {
    async findAll() {
        return prisma.building.findMany({
            orderBy: {
                name: "asc",
            },
            include: {
                floors: {
                    orderBy: {
                        floorNumber: "asc",
                    },
                },
                entranceRoadNode: true,
                complex: true,
                entrances: {
                    include: {
                        roadNode: true,
                    },
                },
            },
        });
    }

    async findById(id: string) {
        return prisma.building.findUnique({
            where: { id },
            include: {
                entranceRoadNode: true,
                complex: true,
                entrances: {
                    include: {
                        roadNode: true,
                    },
                },
            },
        });
    }

    async findByCode(code: string) {
        return prisma.building.findUnique({
            where: {
                code,
            },
            include: {
                entranceRoadNode: true,
                complex: true,
                entrances: {
                    include: {
                        roadNode: true,
                    },
                },
            },
        });
    }

    async findByIdWithDetails(id: string) {
        return prisma.building.findUnique({
            where: { id },
            include: {
                floors: {
                    orderBy: {
                        floorNumber: "asc",
                    },
                },
                announcements: true,
                entranceRoadNode: true,
                complex: true,
                entrances: {
                    include: {
                        roadNode: true,
                    },
                },
                connectionsFrom: {
                    include: {
                        toBuilding: true,
                        fromFloor: true,
                        toFloor: true,
                    },
                },
                connectionsTo: {
                    include: {
                        fromBuilding: true,
                        fromFloor: true,
                        toFloor: true,
                    },
                },
            },
        });
    }

    async update(
        id: string,
        data: {
            name?: string;
            code?: string;
            entranceLatitude?: number;
            entranceLongitude?: number;
            entranceImage?: string;
            coverImage?: string;
            logo?: string;
            themeColor?: string;
            zone?: string;
            entranceRoadNodeId?: string | null;
            complexId?: string | null;
            isActive?: boolean;
        }
    ) {
        return prisma.building.update({
            where: { id },
            data,
            include: {
                entranceRoadNode: true,
                complex: true,
                entrances: {
                    include: {
                        roadNode: true,
                    },
                },
            },
        });
    }

    async softDelete(id: string) {
        return prisma.building.update({
            where: { id },
            data: {
                isActive: false,
            },
        });
    }

    async create(data: {
        name: string;
        code: string;
        entranceLatitude: number;
        entranceLongitude: number;
        entranceImage?: string;
        coverImage?: string;
        logo?: string;
        themeColor?: string;
        zone?: string;
        entranceRoadNodeId?: string | null;
        complexId?: string | null;
    }) {
        return prisma.building.create({
            data: {
                name: data.name,
                code: data.code,
                entranceLatitude: data.entranceLatitude,
                entranceLongitude: data.entranceLongitude,
                entranceImage: data.entranceImage,
                coverImage: data.coverImage,
                logo: data.logo,
                themeColor: data.themeColor,
                zone: data.zone,
                entranceRoadNodeId: data.entranceRoadNodeId,
                complexId: data.complexId,
            },
            include: {
                entranceRoadNode: true,
                complex: true,
                entrances: {
                    include: {
                        roadNode: true,
                    },
                },
            },
        });
    }
}