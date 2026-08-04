import { Request, Response, NextFunction } from "express";
import { AdminProfileService } from "../services/adminProfile.service.js";
import { sendSuccess } from "../utils/response.js";

const svc = new AdminProfileService();

export class AdminProfileController {
    async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const profile = await svc.getProfile();
            // Never expose passwordHash to the client
            const { passwordHash, ...safeProfile } = profile;
            return sendSuccess(res, safeProfile, "Profile retrieved");
        } catch (err) {
            next(err);
        }
    }

    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const { fullName, email, role, avatarUrl } = req.body as {
                fullName?: string;
                email?: string;
                role?: string;
                avatarUrl?: string | null;
            };
            const profile = await svc.updateProfile({ fullName, email, role, avatarUrl });
            const { passwordHash, ...safeProfile } = profile;
            return sendSuccess(res, safeProfile, "Profile updated");
        } catch (err) {
            next(err);
        }
    }

    async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { currentPassword, newPassword } = req.body as {
                currentPassword?: string;
                newPassword?: string;
            };
            if (!currentPassword || !newPassword) {
                res.status(400).json({ success: false, message: "currentPassword and newPassword are required." });
                return;
            }
            await svc.changePassword(currentPassword, newPassword);
            return sendSuccess(res, null, "Password changed successfully");
        } catch (err) {
            next(err);
        }
    }
}
