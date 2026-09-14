import { Request, Response, NextFunction } from "express";
import { BulkImportService } from "../services/bulkImport.service.js";

const service = new BulkImportService();

export async function validateDataset(req: Request, res: Response, next: NextFunction) {
    try {
        const report = service.validateDataset(req.body);
        res.json({ success: true, data: report });
    } catch (err) {
        next(err);
    }
}

export async function importDataset(req: Request, res: Response, next: NextFunction) {
    try {
        const result = await service.importDataset(req.body);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
}
