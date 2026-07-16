import { apiGet, apiPatch, apiDelete, apiPost } from "./client";
import type {
  Staff,
  UpdateStaffBody,
  AliasListData,
  CreateAliasBody,
  SearchAlias,
} from "@/types";

export const staffApi = {
  getById: (id: string) => apiGet<Staff>(`/staff/${id}`),

  update: (id: string, body: UpdateStaffBody) =>
    apiPatch<Staff, UpdateStaffBody>(`/staff/${id}`, body),

  delete: (id: string) => apiDelete<null>(`/staff/${id}`),

  // Nested aliases
  getAliases: (staffId: string) =>
    apiGet<AliasListData>(`/staff/${staffId}/aliases`),

  createAlias: (staffId: string, body: CreateAliasBody) =>
    apiPost<SearchAlias, CreateAliasBody>(`/staff/${staffId}/aliases`, body),
};
