import { prisma } from "../config/prisma.js";

export class BuildingRepository {
    async findAll() {
        return prisma.building.findMany({
            orderBy: {
                name: "asc",
            },
        });
    }

    async findById(id: string) {
        return prisma.building.findUnique({
            where: { id },
        });
    }

    async findByCode(code: string) {
        return prisma.building.findUnique({
            where: {
                code,
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
            isActive?: boolean;
        }
    ) {
        return prisma.building.update({
            where: { id },
            data,
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
    }) {
        return prisma.building.create({
            data: {
                name: data.name,
                code: data.code,
                entranceLatitude: data.entranceLatitude,
                entranceLongitude: data.entranceLongitude,
                entranceImage: data.entranceImage,
                coverImage: data.coverImage,
            },
        });
    }
}