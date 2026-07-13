import { prisma } from "../config/prisma.js";

export class AliasRepository {
    async findAllByOffice(officeId: string) {
        return prisma.searchAlias.findMany({
            where: {
                officeId,
            },
            orderBy: {
                alias: "asc",
            },
        });
    }

    async findAllByStaff(staffId: string) {
        return prisma.searchAlias.findMany({
            where: {
                staffId,
            },
            orderBy: {
                alias: "asc",
            },
        });
    }

    async findById(id: string) {
        return prisma.searchAlias.findUnique({
            where: {
                id,
            },
        });
    }

    async findDuplicateOfficeAlias(officeId: string, normalizedAlias: string) {
        return prisma.searchAlias.findUnique({
            where: {
                normalizedAlias_officeId: {
                    normalizedAlias,
                    officeId,
                },
            },
        });
    }

    async findDuplicateStaffAlias(staffId: string, normalizedAlias: string) {
        return prisma.searchAlias.findUnique({
            where: {
                normalizedAlias_staffId: {
                    normalizedAlias,
                    staffId,
                },
            },
        });
    }

    async create(data: {
        alias: string;
        normalizedAlias: string;
        officeId?: string | null;
        staffId?: string | null;
    }) {
        return prisma.searchAlias.create({
            data: {
                alias: data.alias,
                normalizedAlias: data.normalizedAlias,
                officeId: data.officeId,
                staffId: data.staffId,
            },
        });
    }

    async update(
        id: string,
        data: {
            alias?: string;
            normalizedAlias?: string;
        }
    ) {
        return prisma.searchAlias.update({
            where: {
                id,
            },
            data,
        });
    }

    async delete(id: string) {
        return prisma.searchAlias.delete({
            where: {
                id,
            },
        });
    }
}
