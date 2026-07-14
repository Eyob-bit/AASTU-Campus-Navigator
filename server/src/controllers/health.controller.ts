import { Request, Response } from "express";

export const healthCheck = (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "AASTU Campus Navigator API",
        version: "1.0.0",
    });
};