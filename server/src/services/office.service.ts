import { OfficeRepository } from "../repositories/office.repository.js";
import { FloorRepository } from "../repositories/floor.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/prisma.js";

export class OfficeService {
    private repository = new OfficeRepository();
    private floorRepository = new FloorRepository();

    async getOfficesByFloor(floorId: string) {
        const floor = await this.floorRepository.findById(floorId);
        if (!floor) {
            throw new ApiError(404, "Floor not found");
        }
        return this.repository.findAllByFloor(floorId);
    }

    async getOfficeById(id: string) {
        const office = await this.repository.findById(id);
        if (!office) {
            throw new ApiError(404, "Office not found");
        }
        return office;
    }

    async getOfficeWithDetails(id: string) {
        const office = await this.repository.findByIdWithDetails(id);
        if (!office) {
            throw new ApiError(404, "Office not found");
        }
        return office;
    }

    async createOffice(data: {
        name: string;
        roomNumber: string;
        description?: string;
        floorId: string;
    }) {
        const floor = await this.floorRepository.findById(data.floorId);
        if (!floor) {
            throw new ApiError(404, "Floor not found");
        }

        const existingOffice = await this.repository.findByRoomNumber(
            data.floorId,
            data.roomNumber
        );
        if (existingOffice) {
            throw new ApiError(
                400,
                `Room ${data.roomNumber} already exists on this floor`
            );
        }

        return this.repository.create(data);
    }

    async updateOffice(
        id: string,
        data: {
            name?: string;
            roomNumber?: string;
            description?: string;
        }
    ) {
        const office = await this.repository.findById(id);
        if (!office) {
            throw new ApiError(404, "Office not found");
        }

        if (data.roomNumber !== undefined && data.roomNumber !== office.roomNumber) {
            const existingOffice = await this.repository.findByRoomNumber(
                office.floorId,
                data.roomNumber
            );
            if (existingOffice) {
                throw new ApiError(
                    400,
                    `Room ${data.roomNumber} already exists on this floor`
                );
            }
        }

        return this.repository.update(id, data);
    }

    async deleteOffice(id: string) {
        const office = await this.repository.findById(id);
        if (!office) {
            throw new ApiError(404, "Office not found");
        }

        // Unlink scene elements referencing this office
        await prisma.sceneElement.updateMany({
            where: { officeId: id },
            data: { officeId: null },
        });

        // Delete the office (assigned staff will cascade delete)
        return prisma.office.delete({
            where: { id },
        });
    }
}
