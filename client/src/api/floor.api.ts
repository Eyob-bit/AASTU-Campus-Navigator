import { apiGet, apiPatch, apiDelete, apiPost, apiClient, unwrapResponse, handleApiError } from "./client";
import { ApiRequestError } from "@/types";
import type {
  Floor,
  FloorListData,
  OfficeListData,
  CreateOfficeBody,
  Office,
  SceneListData,
  PanoramaScene,
  ApiResponse,
} from "@/types";

async function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  try {
    const response = await apiClient.post<ApiResponse<T>>(path, formData);
    return unwrapResponse(response);
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    handleApiError(error);
  }
}

async function apiPatchForm<T>(path: string, formData: FormData): Promise<T> {
  try {
    const response = await apiClient.patch<ApiResponse<T>>(path, formData);
    return unwrapResponse(response);
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    handleApiError(error);
  }
}

export { apiPostForm, apiPatchForm };

export const floorApi = {
  // Floors live under buildings — fetch all floors for a given building
  getByBuilding: (buildingId: string) =>
    apiGet<FloorListData>(`/buildings/${buildingId}/floors`),

  create: (buildingId: string, body: { floorNumber: number }) =>
    apiPost<Floor, { floorNumber: number }>(`/buildings/${buildingId}/floors`, body),

  getById: (id: string) => apiGet<Floor>(`/floors/${id}`),

  update: (id: string, body: { floorNumber: number }) =>
    apiPatch<Floor, { floorNumber: number }>(`/floors/${id}`, body),

  delete: (id: string) => apiDelete<null>(`/floors/${id}`),

  // Nested offices
  getOffices: (floorId: string) =>
    apiGet<OfficeListData>(`/floors/${floorId}/offices`),

  createOffice: (floorId: string, body: CreateOfficeBody) =>
    apiPost<Office, CreateOfficeBody>(`/floors/${floorId}/offices`, body),

  // Nested scenes
  getScenes: (floorId: string) =>
    apiGet<SceneListData>(`/floors/${floorId}/scenes`),

  createScene: (floorId: string, formData: FormData) =>
    apiPostForm<PanoramaScene>(`/floors/${floorId}/scenes`, formData),
};
