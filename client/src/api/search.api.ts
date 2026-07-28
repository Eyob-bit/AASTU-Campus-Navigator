import { apiGet } from "./client";
import type { SearchResult, Landmark } from "@/types";

export const searchApi = {
  search: (q: string) =>
    apiGet<SearchResult[]>(`/search?q=${encodeURIComponent(q)}`),

  searchLandmarks: (q: string) =>
    apiGet<Landmark[]>(`/search/landmarks?q=${encodeURIComponent(q)}`),
};

