import { apiGet, apiPost, apiPatch, apiDelete } from "./client";
import type {
  Landmark,
  LandmarkListData,
  CreateLandmarkBody,
  UpdateLandmarkBody,
} from "@/types";

export const landmarkApi = {
  /** GET /api/landmarks — all (admin) */
  getAll: () => apiGet<LandmarkListData>("/landmarks"),

  /** GET /api/landmarks?visible=true — public visible only */
  getVisible: () => apiGet<LandmarkListData>("/landmarks?visible=true"),

  /** GET /api/landmarks/:id */
  getById: (id: string) => apiGet<Landmark>(`/landmarks/${id}`),

  /** POST /api/landmarks */
  create: (body: CreateLandmarkBody) =>
    apiPost<Landmark, CreateLandmarkBody>("/landmarks", body),

  /** PATCH /api/landmarks/:id */
  update: (id: string, body: UpdateLandmarkBody) =>
    apiPatch<Landmark, UpdateLandmarkBody>(`/landmarks/${id}`, body),

  /** DELETE /api/landmarks/:id */
  delete: (id: string) => apiDelete<null>(`/landmarks/${id}`),

  /** GET /api/search/landmarks?q=... */
  search: (q: string) =>
    apiGet<Landmark[]>(`/search/landmarks?q=${encodeURIComponent(q)}`),
};
