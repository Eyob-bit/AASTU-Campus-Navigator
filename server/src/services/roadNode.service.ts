import {
  RoadNodeRepository,
  type CreateRoadNodeData,
  type UpdateRoadNodeData,
} from "../repositories/roadNode.repository.js";
import { RoadNavigationService } from "./roadNavigation.service.js";

const roadNodeRepo = new RoadNodeRepository();

export class RoadNodeService {
  async getAllNodes() {
    return roadNodeRepo.findAll();
  }

  async getNodeById(id: string) {
    const node = await roadNodeRepo.findById(id);
    if (!node) {
      throw new Error(`Road node with ID ${id} not found.`);
    }
    return node;
  }

  async createNode(data: CreateRoadNodeData) {
    if (!data.name || data.latitude == null || data.longitude == null) {
      throw new Error("Name, latitude, and longitude are required.");
    }
    const created = await roadNodeRepo.create(data);
    RoadNavigationService.invalidateGraphCache();
    return created;
  }

  async updateNode(id: string, data: UpdateRoadNodeData) {
    await this.getNodeById(id);
    const updated = await roadNodeRepo.update(id, data);
    RoadNavigationService.invalidateGraphCache();
    return updated;
  }

  async deleteNode(id: string) {
    await this.getNodeById(id);
    const deleted = await roadNodeRepo.delete(id);
    RoadNavigationService.invalidateGraphCache();
    return deleted;
  }
}
