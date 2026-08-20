import bcrypt from "bcryptjs";
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

        // Support both bcrypt hashes and legacy plain-text
        const isHash = profile.passwordHash.startsWith("$2");
        let currentValid = false;
        if (isHash) {
            currentValid = await bcrypt.compare(currentPassword, profile.passwordHash);
        } else {
            currentValid = profile.passwordHash === currentPassword;
        }

        if (!currentValid) {
            throw new ApiError(400, "Current password is incorrect.");
        }
        if (!newPassword || newPassword.length < 6) {
            throw new ApiError(400, "New password must be at least 6 characters.");
        }

        const hashed = await bcrypt.hash(newPassword, 12);
        return repo.update({ passwordHash: hashed });
    }
}
