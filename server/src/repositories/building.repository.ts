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
            },
        });
    }

    async findById(id: string) {
        return prisma.building.findUnique({
            where: { id },
            include: {
                entranceRoadNode: true,
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
            isActive?: boolean;
        }
    ) {
        return prisma.building.update({
            where: { id },
            data,
            include: {
                entranceRoadNode: true,
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
            },
            include: {
                entranceRoadNode: true,
            },
        });
    }
}