import { prisma } from "../config/prisma.js";

const SINGLETON_ID = "admin-singleton";

export class AdminProfileRepository {
    async getOrCreate() {
        const existing = await prisma.adminProfile.findFirst();
        if (existing) return existing;

        return prisma.adminProfile.create({
            data: {
                id: SINGLETON_ID,
                fullName: "Admin User",
                email: "admin@aastu.edu.et",
                role: "Super Admin",
                passwordHash: "admin",
            },
        });
    }

    async update(data: {
        fullName?: string;
        email?: string;
        role?: string;
        avatarUrl?: string | null;
        passwordHash?: string;
    }) {
        const existing = await this.getOrCreate();
        return prisma.adminProfile.update({
            where: { id: existing.id },
            data,
        });
    }
}
