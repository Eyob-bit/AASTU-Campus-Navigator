import { Request, Response, NextFunction } from "express";
import { EntranceRepository } from "../repositories/entrance.repository.js";

const repository = new EntranceRepository();

export async function getEntrancesByBuilding(req: Request<{ buildingId: string }>, res: Response, next: NextFunction) {
    try {
        const entrances = await repository.findByBuildingId(req.params.buildingId as string);
        res.json({ success: true, data: entrances });
    } catch (err) {
        next(err);
    }
}

export async function createEntrance(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, latitude, longitude, image, isPrimary, roadNodeId } = req.body;
        const buildingId = (req.params.buildingId || req.body.buildingId) as string;
        const entrance = await repository.create({
            name,
            buildingId,
            latitude: Number(latitude),
            longitude: Number(longitude),
            image,
            isPrimary: Boolean(isPrimary),
            roadNodeId,
        });
        res.status(201).json({ success: true, data: entrance });
    } catch (err) {
        next(err);
    }
}

export async function updateEntrance(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        const { name, latitude, longitude, image, isPrimary, roadNodeId } = req.body;
        const entrance = await repository.update(req.params.id as string, {
            name,
            latitude: latitude !== undefined ? Number(latitude) : undefined,
            longitude: longitude !== undefined ? Number(longitude) : undefined,
            image,
            isPrimary: isPrimary !== undefined ? Boolean(isPrimary) : undefined,
            roadNodeId,
        });
        res.json({ success: true, data: entrance });
    } catch (err) {
        next(err);
    }
}

export async function deleteEntrance(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        await repository.delete(req.params.id as string);
        res.json({ success: true, message: "Entrance deleted successfully" });
    } catch (err) {
        next(err);
    }
}
