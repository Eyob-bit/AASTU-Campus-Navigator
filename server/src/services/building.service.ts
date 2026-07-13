import { BuildingRepository } from "../repositories/building.repository.js";

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
        return this.repository.softDelete(id);
    }
}

