import { apiGet, apiPatch, apiDelete } from "./client";
import type { SceneElement, UpdateSceneElementBody } from "@/types";

export const sceneElementApi = {
  getById: (id: string) => apiGet<SceneElement>(`/elements/${id}`),

  update: (id: string, body: UpdateSceneElementBody) =>
    apiPatch<SceneElement, UpdateSceneElementBody>(`/elements/${id}`, body),

  delete: (id: string) => apiDelete<null>(`/elements/${id}`),
};
