import { apiGet, apiDelete } from "./client";
import { apiPatchForm } from "./floor.api";
import type {
  PanoramaScene,
  ElementListData,
  CreateSceneElementBody,
  SceneElement,
} from "@/types";
import { apiPost } from "./client";

export const sceneApi = {
  getById: (id: string) => apiGet<PanoramaScene>(`/scenes/${id}`),

  update: (id: string, formData: FormData) =>
    apiPatchForm<PanoramaScene>(`/scenes/${id}`, formData),

  delete: (id: string) => apiDelete<null>(`/scenes/${id}`),

  // Nested elements
  getElements: (sceneId: string) =>
    apiGet<ElementListData>(`/scenes/${sceneId}/elements`),

  createElement: (sceneId: string, body: CreateSceneElementBody) =>
    apiPost<SceneElement, CreateSceneElementBody>(
      `/scenes/${sceneId}/elements`,
      body
    ),
};
