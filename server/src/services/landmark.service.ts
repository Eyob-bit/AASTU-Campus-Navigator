import { LandmarkRepository } from "../repositories/landmark.repository.js";
import { ApiError } from "../utils/ApiError.js";
import type { LandmarkCategory } from "@prisma/client";

interface CreateLandmarkData {
  name: string;
  description?: string;
  category?: LandmarkCategory;
  latitude: number;
  longitude: number;
  icon?: string;
  image?: string;
  isVisible?: boolean;
  buildingId?: string | null;
}

interface UpdateLandmarkData extends Partial<CreateLandmarkData> {}

export class LandmarkService {
  private repository = new LandmarkRepository();

  async getLandmarks() {
    return this.repository.findAll();
  }

  async getVisibleLandmarks() {
    return this.repository.findAllVisible();
  }

  async getLandmarkById(id: string) {
    const landmark = await this.repository.findById(id);
    if (!landmark) {
      throw new ApiError(404, "Landmark not found");
    }
    return landmark;
  }

  async createLandmark(data: CreateLandmarkData) {
    if (!data.name?.trim()) {
      throw new ApiError(400, "Landmark name is required");
    }
    if (data.latitude < -90 || data.latitude > 90) {
      throw new ApiError(400, "Invalid latitude value");
    }
    if (data.longitude < -180 || data.longitude > 180) {
      throw new ApiError(400, "Invalid longitude value");
    }
    return this.repository.create(data);
  }

  async updateLandmark(id: string, data: UpdateLandmarkData) {
    await this.getLandmarkById(id); // throws 404 if not found
    return this.repository.update(id, data);
  }

  async deleteLandmark(id: string) {
    await this.getLandmarkById(id); // throws 404 if not found
    return this.repository.delete(id);
  }

  async searchLandmarks(query: string) {
    const normalized = query.trim().toLowerCase().replace(/\s+/g, " ");
    if (!normalized) return [];

    // Exact first, then contains
    const exact = await this.repository.findByNameExact(normalized);
    if (exact.length > 0) return exact;

    return this.repository.findByName(normalized);
  }
}
