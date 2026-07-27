import { apiGet, apiPatch, apiDelete } from "./client";
import type { SearchAlias, UpdateAliasBody } from "@/types";

export const aliasApi = {
  getById: (id: string) => apiGet<SearchAlias>(`/aliases/${id}`),

  update: (id: string, body: UpdateAliasBody) =>
    apiPatch<SearchAlias, UpdateAliasBody>(`/aliases/${id}`, body),

  delete: (id: string) => apiDelete<null>(`/aliases/${id}`),
};
