import { apiGet, apiPost, apiPatch, apiDelete } from "./client";
import type {
  Building,
  BuildingListData,
  CreateBuildingBody,
  UpdateBuildingBody,
  FloorListData,
  CreateFloorBody,
  Floor,
} from "@/types";

export const buildingApi = {
  getAll: () => apiGet<BuildingListData>("/buildings"),

  getById: (id: string) => apiGet<Building>(`/buildings/${id}`),

  create: (body: CreateBuildingBody) => apiPost<Building, CreateBuildingBody>("/buildings", body),

  update: (id: string, body: UpdateBuildingBody) =>
    apiPatch<Building, UpdateBuildingBody>(`/buildings/${id}`, body),

  delete: (id: string) => apiDelete<null>(`/buildings/${id}`),

  // Nested floors
  getFloors: (buildingId: string) =>
    apiGet<FloorListData>(`/buildings/${buildingId}/floors`),

  createFloor: (buildingId: string, body: CreateFloorBody) =>
    apiPost<Floor, CreateFloorBody>(`/buildings/${buildingId}/floors`, body),
};
