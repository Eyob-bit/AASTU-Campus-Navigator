import { apiGet } from "./client";
import type { NavigationResult } from "@/types";

export const navigationApi = {
  navigate: (officeId: string) =>
    apiGet<NavigationResult>(`/navigation/${officeId}`),
};
