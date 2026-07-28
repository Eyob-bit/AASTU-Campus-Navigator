import type { Request, Response } from "express";
import { RoadNodeService } from "../services/roadNode.service.js";

const roadNodeService = new RoadNodeService();

export async function getRoadNodes(req: Request, res: Response): Promise<void> {
  try {
    const nodes = await roadNodeService.getAllNodes();
    res.json({ success: true, nodes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch road nodes.";
    res.status(500).json({ success: false, error: message });
  }
}

export async function getRoadNodeById(req: Request, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const node = await roadNodeService.getNodeById(id);
    res.json({ success: true, node });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch road node.";
    res.status(404).json({ success: false, error: message });
  }
}

export async function createRoadNode(req: Request, res: Response): Promise<void> {
  try {
    const { name, latitude, longitude } = req.body;
    const node = await roadNodeService.createNode({
      name,
      latitude: Number(latitude),
      longitude: Number(longitude),
    });
    res.status(201).json({ success: true, node });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create road node.";
    res.status(400).json({ success: false, error: message });
  }
}

export async function updateRoadNode(req: Request, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, latitude, longitude } = req.body;
    const node = await roadNodeService.updateNode(id, {
      ...(name !== undefined && { name }),
      ...(latitude !== undefined && { latitude: Number(latitude) }),
      ...(longitude !== undefined && { longitude: Number(longitude) }),
    });
    res.json({ success: true, node });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update road node.";
    res.status(400).json({ success: false, error: message });
  }
}

export async function deleteRoadNode(req: Request, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await roadNodeService.deleteNode(id);
    res.json({ success: true, message: "Road node deleted successfully." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete road node.";
    res.status(400).json({ success: false, error: message });
  }
}
