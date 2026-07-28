import {
  RoadEdgeRepository,
  type CreateRoadEdgeData,
  type UpdateRoadEdgeData,
} from "../repositories/roadEdge.repository.js";
import { RoadNodeRepository } from "../repositories/roadNode.repository.js";
import { calculateHaversineDistance } from "../utils/haversine.js";

const roadEdgeRepo = new RoadEdgeRepository();
const roadNodeRepo = new RoadNodeRepository();

export class RoadEdgeService {
  async getAllEdges() {
    return roadEdgeRepo.findAll();
  }

  async getEdgeById(id: string) {
    const edge = await roadEdgeRepo.findById(id);
    if (!edge) {
      throw new Error(`Road edge with ID ${id} not found.`);
    }
    return edge;
  }

  async createEdge(data: Partial<CreateRoadEdgeData> & { fromNodeId: string; toNodeId: string }) {
    if (!data.fromNodeId || !data.toNodeId) {
      throw new Error("fromNodeId and toNodeId are required.");
    }

    if (data.fromNodeId === data.toNodeId) {
      throw new Error("Cannot connect a road node to itself.");
    }

    const fromNode = await roadNodeRepo.findById(data.fromNodeId);
    const toNode = await roadNodeRepo.findById(data.toNodeId);

    if (!fromNode || !toNode) {
      throw new Error("One or both specified road nodes do not exist.");
    }

    // Auto-calculate Haversine distance if not explicitly supplied or <= 0
    let distance = data.distance;
    if (distance == null || distance <= 0) {
      distance = calculateHaversineDistance(
        fromNode.latitude,
        fromNode.longitude,
        toNode.latitude,
        toNode.longitude
      );
    }

    return roadEdgeRepo.create({
      fromNodeId: data.fromNodeId,
      toNodeId: data.toNodeId,
      distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
      isBidirectional: data.isBidirectional ?? true,
    });
  }

  async updateEdge(id: string, data: UpdateRoadEdgeData) {
    await this.getEdgeById(id);
    return roadEdgeRepo.update(id, data);
  }

  async deleteEdge(id: string) {
    await this.getEdgeById(id);
    return roadEdgeRepo.delete(id);
  }
}
