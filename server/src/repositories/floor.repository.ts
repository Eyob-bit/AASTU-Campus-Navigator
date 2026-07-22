import { prisma } from "../config/prisma.js";

export class FloorRepository {
    async findAllByBuilding(buildingId: string) {
        return prisma.floor.findMany({
            where: {
                buildingId,
            },
            orderBy: {
                floorNumber: "asc",
            },
        });
    }

    async findById(id: string) {
        return prisma.floor.findUnique({
            where: {
                id,
            },
        });
    }

    async findByBuildingAndFloorNumber(
        buildingId: string,
        floorNumber: number
    ) {
        return prisma.floor.findUnique({
            where: {
                buildingId_floorNumber: {
                    buildingId,
                    floorNumber,
                },
            },
        });
    }

    async findByIdWithDetails(id: string) {
        return prisma.floor.findUnique({
            where: {
                id,
            },
            include: {
                building: true,
                offices: {
                    orderBy: {
                        roomNumber: "asc",
                    },
                },
                scenes: {
                    orderBy: {
                        displayOrder: "asc",
                    },
                },
            },
        });
    }

    async create(data: {
        floorNumber: number;
        buildingId: string;
    }) {
        return prisma.floor.create({
            data: {
                floorNumber: data.floorNumber,
                buildingId: data.buildingId,
            },
        });
    }

    async update(
        id: string,
        data: {
            floorNumber?: number;
        }
    ) {
        return prisma.floor.update({
            where: {
                id,
            },
            data,
        });
    }

    async delete(id: string) {
        return prisma.floor.delete({
            where: {
                id,
            },
        });
    }
}
