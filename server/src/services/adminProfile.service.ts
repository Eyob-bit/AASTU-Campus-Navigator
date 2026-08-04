import { AdminProfileRepository } from "../repositories/adminProfile.repository.js";
import { ApiError } from "../utils/ApiError.js";

const repo = new AdminProfileRepository();

export class AdminProfileService {
    async getProfile() {
        return repo.getOrCreate();
    }

    async updateProfile(data: {
        fullName?: string;
        email?: string;
        role?: string;
        avatarUrl?: string | null;
    }) {
        return repo.update(data);
    }

    async changePassword(currentPassword: string, newPassword: string) {
        const profile = await repo.getOrCreate();

        if (profile.passwordHash !== currentPassword) {
            throw new ApiError(400, "Current password is incorrect.");
        }
        if (!newPassword || newPassword.length < 4) {
            throw new ApiError(400, "New password must be at least 4 characters.");
        }

        return repo.update({ passwordHash: newPassword });
    }
}
