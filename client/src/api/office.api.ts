import { apiGet, apiPatch, apiDelete, apiPost } from "./client";
import type {
  Office,
  OfficeListData,
  CreateOfficeBody,
  UpdateOfficeBody,
  StaffListData,
  CreateStaffBody,
  Staff,
  AliasListData,
  CreateAliasBody,
  SearchAlias,
} from "@/types";

export const officeApi = {
  // Offices live under floors
  getByFloor: (floorId: string) =>
    apiGet<OfficeListData>(`/floors/${floorId}/offices`),

  create: (floorId: string, body: CreateOfficeBody) =>
    apiPost<Office, CreateOfficeBody>(`/floors/${floorId}/offices`, body),

  getById: (id: string) => apiGet<Office>(`/offices/${id}`),

  update: (id: string, body: UpdateOfficeBody) =>
    apiPatch<Office, UpdateOfficeBody>(`/offices/${id}`, body),

  delete: (id: string) => apiDelete<null>(`/offices/${id}`),

  // Nested staff
  getStaff: (officeId: string) =>
    apiGet<StaffListData>(`/offices/${officeId}/staff`),

  createStaff: (officeId: string, body: CreateStaffBody) =>
    apiPost<Staff, CreateStaffBody>(`/offices/${officeId}/staff`, body),

  // Nested aliases
  getAliases: (officeId: string) =>
    apiGet<AliasListData>(`/offices/${officeId}/aliases`),

  createAlias: (officeId: string, body: CreateAliasBody) =>
    apiPost<SearchAlias, CreateAliasBody>(`/offices/${officeId}/aliases`, body),
};
