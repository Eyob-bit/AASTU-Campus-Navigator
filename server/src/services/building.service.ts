import { BuildingRepository } from "../repositories/building.repository.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

export class BuildingService {
    private repository = new BuildingRepository();

    async getBuildings() {
        return this.repository.findAll();
    }

    async getBuilding(id: string) {
        return this.repository.findById(id);
    }

    async createBuilding(data: any) {
        return this.repository.create(data);
    }

    async getBuildingById(id: string) {
        return this.repository.findByIdWithDetails(id);
    }

    async updateBuilding(
        id: string,
        data: any
    ) {
        return this.repository.update(id, data);
    }

    async deleteBuilding(id: string) {
        const building = await this.repository.findById(id);
        if (!building) {
            throw new ApiError(404, "Building not found");
        }

        // Find all floors for this building
        const floors = await prisma.floor.findMany({
            where: { buildingId: id },
            select: { id: true },
        });
        const floorIds = floors.map((f) => f.id);

        if (floorIds.length > 0) {
            const offices = await prisma.office.findMany({
                where: { floorId: { in: floorIds } },
                select: { id: true },
            });
            const officeIds = offices.map((o) => o.id);

            if (officeIds.length > 0) {
                // Unlink scene elements referencing offices in this building
                await prisma.sceneElement.updateMany({
                    where: { officeId: { in: officeIds } },
                    data: { officeId: null },
                });
            }
        }

        // Hard delete building (floors, offices, staff cascade delete via Prisma schema)
        return prisma.building.delete({
            where: { id },
        });
    }
}
