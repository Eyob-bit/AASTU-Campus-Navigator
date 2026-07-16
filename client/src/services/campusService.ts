import { apiGet } from "@/api";
import type { NavigationResult, SearchResult } from "@/types";

export async function searchCampus(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query });
  return apiGet<SearchResult[]>(`/search?${params.toString()}`);
}

export async function getNavigationPath(
  officeId: string
): Promise<NavigationResult> {
  return apiGet<NavigationResult>(`/navigation/${officeId}`);
}
