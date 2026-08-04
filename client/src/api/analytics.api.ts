import { apiGet } from "./client";

export interface AnalyticsOverview {
  totalSearches: number;
  noResultCount: number;
  searchSuccessRate: number;
  totalNavigations: number;
  completedNavigations: number;
  navSuccessRate: number;
  buildingCount: number;
  officeCount: number;
  aliasCount: number;
}

export interface TopSearchItem {
  query: string;
  count: number;
}

export interface SearchTrendItem {
  date: string;
  total: number;
  successful: number;
  failed: number;
}

export interface NavigationStats {
  total: number;
  completed: number;
  cancelled: number;
  active: number;
  completionRate: number;
}

export interface PopularBuildingItem {
  buildingName: string;
  visits: number;
}

export const analyticsApi = {
  getOverview: (range?: string) =>
    apiGet<AnalyticsOverview>(`/analytics/overview${range ? `?range=${range}` : ""}`),

  getTopSearches: (range?: string, limit: number = 10) =>
    apiGet<TopSearchItem[]>(`/analytics/top-searches?limit=${limit}${range ? `&range=${range}` : ""}`),

  getNoResults: (range?: string, limit: number = 10) =>
    apiGet<TopSearchItem[]>(`/analytics/no-results?limit=${limit}${range ? `&range=${range}` : ""}`),

  getSearchTrend: (range?: string) =>
    apiGet<SearchTrendItem[]>(`/analytics/search-trend${range ? `?range=${range}` : ""}`),

  getNavigationStats: (range?: string) =>
    apiGet<NavigationStats>(`/analytics/navigation${range ? `?range=${range}` : ""}`),

  getPopularBuildings: (range?: string, limit: number = 8) =>
    apiGet<PopularBuildingItem[]>(`/analytics/popular-buildings?limit=${limit}${range ? `&range=${range}` : ""}`),
};
