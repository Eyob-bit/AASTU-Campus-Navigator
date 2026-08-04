import { apiGet, apiPost, apiPatch, apiDelete } from "./client";
import type { SearchAlias, CreateAliasBody, UpdateAliasBody, AliasListData } from "@/types";

export const aliasApi = {
  getAll: () => apiGet<AliasListData>("/aliases"),

  getById: (id: string) => apiGet<SearchAlias>(`/aliases/${id}`),

  createForOffice: (officeId: string, body: CreateAliasBody) =>
    apiPost<SearchAlias, CreateAliasBody>(`/offices/${officeId}/aliases`, body),

  createForStaff: (staffId: string, body: CreateAliasBody) =>
    apiPost<SearchAlias, CreateAliasBody>(`/staff/${staffId}/aliases`, body),

  update: (id: string, body: UpdateAliasBody) =>
    apiPatch<SearchAlias, UpdateAliasBody>(`/aliases/${id}`, body),

  delete: (id: string) => apiDelete<null>(`/aliases/${id}`),
};
