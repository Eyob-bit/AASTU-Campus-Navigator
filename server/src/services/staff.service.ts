import { StaffRepository } from "../repositories/staff.repository.js";
import { OfficeRepository } from "../repositories/office.repository.js";
import { ApiError } from "../utils/ApiError.js";

export class StaffService {
    private repository = new StaffRepository();
    private officeRepository = new OfficeRepository();

    async getStaffByOffice(officeId: string) {
        const office = await this.officeRepository.findById(officeId);
        if (!office) {
            throw new ApiError(404, "Office not found");
        }
        return this.repository.findAllByOffice(officeId);
    }

    async getStaffById(id: string) {
        const staff = await this.repository.findByIdWithDetails(id);
        if (!staff) {
            throw new ApiError(404, "Staff not found");
        }
        return staff;
    }

    async createStaff(
        officeId: string,
        data: {
            fullName: string;
            position: string;
            email?: string | null;
            phone?: string | null;
        }
    ) {
        const office = await this.officeRepository.findById(officeId);
        if (!office) {
            throw new ApiError(404, "Office not found");
        }

        const existingStaff = await this.repository.findByNameInOffice(
            officeId,
            data.fullName
        );
        if (existingStaff) {
            throw new ApiError(
                400,
                "Staff member already exists in this office"
            );
        }

        return this.repository.create({
            ...data,
            officeId,
        });
    }

    async updateStaff(
        id: string,
        data: {
            fullName?: string;
            position?: string;
            email?: string | null;
            phone?: string | null;
            officeId?: string;
        }
    ) {
        const staff = await this.repository.findById(id);
        if (!staff) {
            throw new ApiError(404, "Staff not found");
        }

        const targetOfficeId = data.officeId !== undefined ? data.officeId : staff.officeId;
        const targetFullName = data.fullName !== undefined ? data.fullName : staff.fullName;

        if (data.officeId !== undefined) {
            const office = await this.officeRepository.findById(data.officeId);
            if (!office) {
                throw new ApiError(404, "Office not found");
            }
        }

        if (targetFullName !== staff.fullName || targetOfficeId !== staff.officeId) {
            const existingStaff = await this.repository.findByNameInOffice(
                targetOfficeId,
                targetFullName
            );
            if (existingStaff) {
                throw new ApiError(
                    400,
                    "Staff member already exists in this office"
                );
            }
        }

        return this.repository.update(id, data);
    }

    async deleteStaff(id: string) {
        const staff = await this.repository.findById(id);
        if (!staff) {
            throw new ApiError(404, "Staff not found");
        }

        return this.repository.softDelete(id);
    }
}
