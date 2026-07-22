import { prisma } from "../config/prisma.js";

export class OfficeRepository {
    async findAllByFloor(floorId: string) {
        return prisma.office.findMany({
            where: {
                floorId,
                isActive: true,
            },
            orderBy: {
                roomNumber: "asc",
            },
        });
    }

    async findById(id: string) {
        return prisma.office.findFirst({
            where: {
                id,
                isActive: true,
            },
        });
    }

    async findByIdWithDetails(id: string) {
        return prisma.office.findFirst({
            where: {
                id,
                isActive: true,
            },
            include: {
                floor: {
                    include: {
                        building: true,
                    },
                },
                staff: {
                    where: {
                        isActive: true,
                    },
                },
                aliases: true,
                announcements: true,
                sceneElements: true,
            },
        });
    }

    async findByRoomNumber(floorId: string, roomNumber: string) {
        return prisma.office.findFirst({
            where: {
                floorId,
                roomNumber,
                isActive: true,
            },
        });
    }

    async create(data: {
        name: string;
        roomNumber: string;
        description?: string;
        floorId: string;
    }) {
        return prisma.office.create({
            data: {
                name: data.name,
                roomNumber: data.roomNumber,
                description: data.description,
                floorId: data.floorId,
            },
        });
    }

    async update(
        id: string,
        data: {
            name?: string;
            roomNumber?: string;
            description?: string;
            isActive?: boolean;
        }
    ) {
        return prisma.office.update({
            where: {
                id,
            },
            data,
        });
    }

    async softDelete(id: string) {
        return prisma.office.update({
            where: {
                id,
            },
            data: {
                isActive: false,
            },
        });
    }
}
