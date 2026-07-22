import { apiGet } from "./client";
import type { SearchResult } from "@/types";

export const searchApi = {
  search: (q: string) =>
    apiGet<SearchResult[]>(`/search?q=${encodeURIComponent(q)}`),
};
