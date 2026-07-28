import type { Request, Response } from "express";
import { RoadNavigationService } from "../services/roadNavigation.service.js";

const roadNavService = new RoadNavigationService();

export async function calculateRoute(req: Request, res: Response): Promise<void> {
  try {
    const { startLat, startLng, destLat, destLng, destNodeId } = req.body;

    const route = await roadNavService.calculateRoute({
      startLat: Number(startLat),
      startLng: Number(startLng),
      ...(destLat != null && { destLat: Number(destLat) }),
      ...(destLng != null && { destLng: Number(destLng) }),
      ...(destNodeId && { destNodeId }),
    });

    res.json({ success: true, route });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to calculate navigation route.";
    res.status(400).json({ success: false, error: message });
  }
}
