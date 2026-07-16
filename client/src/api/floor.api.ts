import { apiClient, apiGet, apiPatch, apiDelete, apiPost } from "./client";
import { ApiRequestError } from "@/types";
import type {
  Floor,
  OfficeListData,
  CreateOfficeBody,
  Office,
  SceneListData,
  PanoramaScene,
  ApiResponse,
} from "@/types";

async function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  try {
    const response = await apiClient.post<ApiResponse<T>>(path, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const body = response.data;
    if (!body.success) throw new ApiRequestError(response.status, body.message);
    return body.data;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError(500, "Request failed");
  }
}

async function apiPatchForm<T>(path: string, formData: FormData): Promise<T> {
  try {
    const response = await apiClient.patch<ApiResponse<T>>(path, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const body = response.data;
    if (!body.success) throw new ApiRequestError(response.status, body.message);
    return body.data;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError(500, "Request failed");
  }
}

export { apiPostForm, apiPatchForm };

export const floorApi = {
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
