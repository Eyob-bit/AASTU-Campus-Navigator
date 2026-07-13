import { FloorRepository } from "../repositories/floor.repository.js";
import { BuildingRepository } from "../repositories/building.repository.js";
import { ApiError } from "../utils/ApiError.js";

export class FloorService {
    private repository = new FloorRepository();
    private buildingRepository = new BuildingRepository();

    async getFloorsByBuilding(buildingId: string) {
        const building = await this.buildingRepository.findById(buildingId);
        if (!building) {
            throw new ApiError(404, "Building not found");
        }
        return this.repository.findAllByBuilding(buildingId);
    }

    async getFloorById(id: string) {
        const floor = await this.repository.findById(id);
        if (!floor) {
            throw new ApiError(404, "Floor not found");
        }
        return floor;
    }

    async getFloorWithDetails(id: string) {
        const floor = await this.repository.findByIdWithDetails(id);
        if (!floor) {
            throw new ApiError(404, "Floor not found");
        }
        return floor;
    }

    async createFloor(data: { floorNumber: number; buildingId: string }) {
        const building = await this.buildingRepository.findById(data.buildingId);
        if (!building) {
            throw new ApiError(404, "Building not found");
        }

        const existingFloor = await this.repository.findByBuildingAndFloorNumber(
            data.buildingId,
            data.floorNumber
        );
        if (existingFloor) {
            throw new ApiError(
                400,
                `Floor ${data.floorNumber} already exists in this building`
            );
        }

        return this.repository.create(data);
    }

    async updateFloor(id: string, data: { floorNumber?: number }) {
        const floor = await this.repository.findById(id);
        if (!floor) {
            throw new ApiError(404, "Floor not found");
        }

        if (data.floorNumber !== undefined && data.floorNumber !== floor.floorNumber) {
            const existingFloor = await this.repository.findByBuildingAndFloorNumber(
                floor.buildingId,
                data.floorNumber
            );
            if (existingFloor) {
                throw new ApiError(
                    400,
                    `Floor ${data.floorNumber} already exists in this building`
                );
            }
        }

        return this.repository.update(id, data);
    }

    async deleteFloor(id: string) {
        const floor = await this.repository.findByIdWithDetails(id);
        if (!floor) {
            throw new ApiError(404, "Floor not found");
        }

        if (floor.offices && floor.offices.length > 0) {
            throw new ApiError(
                400,
                "Cannot delete a floor that still contains offices"
            );
        }

        return this.repository.delete(id);
    }
}
