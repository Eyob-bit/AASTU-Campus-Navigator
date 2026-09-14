import { Request, Response, NextFunction } from "express";
import { ComplexService } from "../services/complex.service.js";

const service = new ComplexService();

export async function getComplexes(_req: Request, res: Response, next: NextFunction) {
    try {
        const complexes = await service.getComplexes();
        res.json({ success: true, data: complexes });
    } catch (err) {
        next(err);
    }
}

export async function getComplexById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        const complex = await service.getComplex(req.params.id as string);
        res.json({ success: true, data: complex });
    } catch (err) {
        next(err);
    }
}

export async function createComplex(req: Request, res: Response, next: NextFunction) {
    try {
        const created = await service.createComplex(req.body);
        res.status(201).json({ success: true, data: created });
    } catch (err) {
        next(err);
    }
}

export async function updateComplex(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        const updated = await service.updateComplex(req.params.id as string, req.body);
        res.json({ success: true, data: updated });
    } catch (err) {
        next(err);
    }
}

export async function deleteComplex(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        await service.deleteComplex(req.params.id as string);
        res.json({ success: true, message: "Building complex deleted successfully" });
    } catch (err) {
        next(err);
    }
}

// ── Connections ──────────────────────────────────────────────────────────────
export async function getConnections(req: Request, res: Response, next: NextFunction) {
    try {
        const complexId = req.query.complexId as string | undefined;
        const connections = await service.getConnections(complexId);
        res.json({ success: true, data: connections });
    } catch (err) {
        next(err);
    }
}

export async function createConnection(req: Request, res: Response, next: NextFunction) {
    try {
        const connection = await service.createConnection(req.body);
        res.status(201).json({ success: true, data: connection });
    } catch (err) {
        next(err);
    }
}

export async function deleteConnection(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        await service.deleteConnection(req.params.id as string);
        res.json({ success: true, message: "Connection deleted successfully" });
    } catch (err) {
        next(err);
    }
}
