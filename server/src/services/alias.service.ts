import { AliasRepository } from "../repositories/alias.repository.js";
import { OfficeRepository } from "../repositories/office.repository.js";
import { StaffRepository } from "../repositories/staff.repository.js";
import { normalizeAlias } from "../utils/normalizeAlias.js";
import { ApiError } from "../utils/ApiError.js";

export class AliasService {
    private repository = new AliasRepository();
    private officeRepository = new OfficeRepository();
    private staffRepository = new StaffRepository();

    async getAliasesByOffice(officeId: string) {
        const office = await this.officeRepository.findById(officeId);
        if (!office) {
            throw new ApiError(404, "Office not found");
        }
        return this.repository.findAllByOffice(officeId);
    }

    async getAliasesByStaff(staffId: string) {
        const staff = await this.staffRepository.findById(staffId);
        if (!staff) {
            throw new ApiError(404, "Staff not found");
        }
        return this.repository.findAllByStaff(staffId);
    }

    async getAliasById(id: string) {
        const alias = await this.repository.findById(id);
        if (!alias) {
            throw new ApiError(404, "Alias not found");
        }
        return alias;
    }

    async createOfficeAlias(officeId: string, data: { alias: string }) {
        const office = await this.officeRepository.findById(officeId);
        if (!office) {
            throw new ApiError(404, "Office not found");
        }

        const normalized = normalizeAlias(data.alias);

        const existing = await this.repository.findDuplicateOfficeAlias(
            officeId,
            normalized
        );
        if (existing) {
            throw new ApiError(
                400,
                `Alias "${data.alias}" already exists for this office`
            );
        }

        return this.repository.create({
            alias: data.alias,
            normalizedAlias: normalized,
            officeId,
        });
    }

    async createStaffAlias(staffId: string, data: { alias: string }) {
        const staff = await this.staffRepository.findById(staffId);
        if (!staff) {
            throw new ApiError(404, "Staff not found");
        }

        const normalized = normalizeAlias(data.alias);

        const existing = await this.repository.findDuplicateStaffAlias(
            staffId,
            normalized
        );
        if (existing) {
            throw new ApiError(
                400,
                `Alias "${data.alias}" already exists for this staff member`
            );
        }

        return this.repository.create({
            alias: data.alias,
            normalizedAlias: normalized,
            staffId,
        });
    }

    async updateAlias(id: string, data: { alias?: string }) {
        const aliasRecord = await this.repository.findById(id);
        if (!aliasRecord) {
            throw new ApiError(404, "Alias not found");
        }

        if (data.alias === undefined) {
            return aliasRecord;
        }

        const normalized = normalizeAlias(data.alias);

        if (aliasRecord.officeId) {
            const existing = await this.repository.findDuplicateOfficeAlias(
                aliasRecord.officeId,
                normalized
            );
            if (existing && existing.id !== id) {
                throw new ApiError(
                    400,
                    `Alias "${data.alias}" already exists for this office`
                );
            }
        } else if (aliasRecord.staffId) {
            const existing = await this.repository.findDuplicateStaffAlias(
                aliasRecord.staffId,
                normalized
            );
            if (existing && existing.id !== id) {
                throw new ApiError(
                    400,
                    `Alias "${data.alias}" already exists for this staff member`
                );
            }
        }

        return this.repository.update(id, {
            alias: data.alias,
            normalizedAlias: normalized,
        });
    }

    async deleteAlias(id: string) {
        const aliasRecord = await this.repository.findById(id);
        if (!aliasRecord) {
            throw new ApiError(404, "Alias not found");
        }

        return this.repository.delete(id);
    }
}
