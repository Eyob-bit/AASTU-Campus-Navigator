import { prisma } from "../config/prisma.js";

export class EntranceRepository {
    async findByBuildingId(buildingId: string) {
        return prisma.buildingEntrance.findMany({
            where: { buildingId },
            include: { roadNode: true },
            orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
        });
    }

    async findById(id: string) {
        return prisma.buildingEntrance.findUnique({
            where: { id },
            include: { roadNode: true, building: true },
        });
    }

    async create(data: {
        name: string;
        buildingId: string;
        latitude: number;
        longitude: number;
        image?: string | null;
        isPrimary?: boolean;
        roadNodeId?: string | null;
    }) {
        if (data.isPrimary) {
            // Unset other primary entrances for this building
            await prisma.buildingEntrance.updateMany({
                where: { buildingId: data.buildingId, isPrimary: true },
                data: { isPrimary: false },
            });
        }

        return prisma.buildingEntrance.create({
            data: {
                name: data.name,
                buildingId: data.buildingId,
                latitude: data.latitude,
                longitude: data.longitude,
                image: data.image,
                isPrimary: data.isPrimary ?? false,
                roadNodeId: data.roadNodeId,
            },
            include: { roadNode: true },
        });
    }

    async update(
        id: string,
        data: {
            name?: string;
            latitude?: number;
            longitude?: number;
            image?: string | null;
            isPrimary?: boolean;
            roadNodeId?: string | null;
        }
    ) {
        if (data.isPrimary) {
            const current = await prisma.buildingEntrance.findUnique({ where: { id } });
            if (current) {
                await prisma.buildingEntrance.updateMany({
                    where: { buildingId: current.buildingId, isPrimary: true, NOT: { id } },
                    data: { isPrimary: false },
                });
            }
        }

        return prisma.buildingEntrance.update({
            where: { id },
            data,
            include: { roadNode: true },
        });
    }

    async delete(id: string) {
        return prisma.buildingEntrance.delete({
            where: { id },
        });
    }
}
