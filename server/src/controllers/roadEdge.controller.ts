import type { Request, Response } from "express";
import { RoadEdgeService } from "../services/roadEdge.service.js";

const roadEdgeService = new RoadEdgeService();

export async function getRoadEdges(req: Request, res: Response): Promise<void> {
  try {
    const edges = await roadEdgeService.getAllEdges();
    res.json({ success: true, edges });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch road edges.";
    res.status(500).json({ success: false, error: message });
  }
}

export async function getRoadEdgeById(req: Request, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const edge = await roadEdgeService.getEdgeById(id);
    res.json({ success: true, edge });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch road edge.";
    res.status(404).json({ success: false, error: message });
  }
}

export async function createRoadEdge(req: Request, res: Response): Promise<void> {
  try {
    const { fromNodeId, toNodeId, distance, isBidirectional, isWalkable } = req.body;
    const edge = await roadEdgeService.createEdge({
      fromNodeId,
      toNodeId,
      distance: distance != null ? Number(distance) : undefined,
      isBidirectional: isBidirectional ?? true,
      isWalkable: isWalkable ?? true,
    });
    res.status(201).json({ success: true, edge });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create road edge.";
    res.status(400).json({ success: false, error: message });
  }
}

export async function updateRoadEdge(req: Request, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { fromNodeId, toNodeId, distance, isBidirectional, isWalkable } = req.body;
    const edge = await roadEdgeService.updateEdge(id, {
      ...(fromNodeId && { fromNodeId }),
      ...(toNodeId && { toNodeId }),
      ...(distance != null && { distance: Number(distance) }),
      ...(isBidirectional != null && { isBidirectional }),
      ...(isWalkable != null && { isWalkable }),
    });
    res.json({ success: true, edge });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update road edge.";
    res.status(400).json({ success: false, error: message });
  }
}

export async function deleteRoadEdge(req: Request, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await roadEdgeService.deleteEdge(id);
    res.json({ success: true, message: "Road edge deleted successfully." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete road edge.";
    res.status(400).json({ success: false, error: message });
  }
}
