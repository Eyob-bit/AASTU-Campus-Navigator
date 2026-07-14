import { prisma } from "../config/prisma.js";

export class StaffRepository {
    async findAllByOffice(officeId: string) {
        return prisma.staff.findMany({
            where: {
                officeId,
                isActive: true,
            },
            orderBy: {
                fullName: "asc",
            },
        });
    }

    async findById(id: string) {
        return prisma.staff.findFirst({
            where: {
                id,
                isActive: true,
            },
        });
    }

    async findByIdWithDetails(id: string) {
        return prisma.staff.findFirst({
            where: {
                id,
                isActive: true,
            },
            include: {
                office: {
                    include: {
                        floor: {
                            include: {
                                building: true,
                            },
                        },
                    },
                },
                aliases: true,
            },
        });
    }

    async findByNameInOffice(officeId: string, fullName: string) {
        return prisma.staff.findFirst({
            where: {
                officeId,
                fullName,
                isActive: true,
            },
        });
    }

    async create(data: {
        fullName: string;
        position: string;
        email?: string | null;
        phone?: string | null;
        officeId: string;
    }) {
        return prisma.staff.create({
            data: {
                fullName: data.fullName,
                position: data.position,
                email: data.email,
                phone: data.phone,
                officeId: data.officeId,
            },
        });
    }

    async update(
        id: string,
        data: {
            fullName?: string;
            position?: string;
            email?: string | null;
            phone?: string | null;
            officeId?: string;
            isActive?: boolean;
        }
    ) {
        return prisma.staff.update({
            where: {
                id,
            },
            data,
        });
    }

    async softDelete(id: string) {
        return prisma.staff.update({
            where: {
                id,
            },
            data: {
                isActive: false,
            },
        });
    }
}
