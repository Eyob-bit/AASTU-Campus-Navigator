import { Request, Response, NextFunction } from "express";
import { StaffService } from "../services/staff.service.js";
import { sendSuccess } from "../utils/response.js";

const staffService = new StaffService();

export class StaffController {
    async getStaffByOffice(
        req: Request<{ officeId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const staff = await staffService.getStaffByOffice(req.params.officeId);

            return sendSuccess(
                res,
                {
                    count: staff.length,
                    staff,
                },
                "Staff members retrieved successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async getStaffById(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const staff = await staffService.getStaffById(req.params.id);

            return sendSuccess(
                res,
                staff,
                "Staff member retrieved successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async createStaff(
        req: Request<{ officeId: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const staff = await staffService.createStaff(
                req.params.officeId,
                req.body
            );

            return sendSuccess(
                res,
                staff,
                "Staff member created successfully",
                201
            );
        } catch (error) {
            next(error);
        }
    }

    async updateStaff(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const staff = await staffService.updateStaff(
                req.params.id,
                req.body
            );

            return sendSuccess(
                res,
                staff,
                "Staff member updated successfully"
            );
        } catch (error) {
            next(error);
        }
    }

    async deleteStaff(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            await staffService.deleteStaff(req.params.id);

            return sendSuccess(
                res,
                null,
                "Staff deleted successfully"
            );
        } catch (error) {
            next(error);
        }
    }
}

export const staffController = new StaffController();
