import { useMutation, useQuery } from "@tanstack/react-query";
import { getNavigationPath, searchCampus } from "@/services";
import { useAppStore } from "@/store";
import type { NavigationResult, SearchResult } from "@/types";

export const campusQueryKeys = {
  search: (query: string) => ["campus", "search", query] as const,
  navigation: (officeId: string) => ["campus", "navigation", officeId] as const,
};

export function useCampusSearch() {
  const { setSearchQuery, setSearchResults } = useAppStore();

  return useMutation({
    mutationFn: (query: string) => searchCampus(query),
    onMutate: (query: string) => {
      setSearchQuery(query);
    },
    onSuccess: (results: SearchResult[]) => {
      setSearchResults(results);
    },
    onError: () => {
      setSearchResults([]);
    },
  });
}

export function useNavigationPath(officeId: string | null) {
  const { setNavigation } = useAppStore();

  return useQuery({
    queryKey: campusQueryKeys.navigation(officeId ?? ""),
    queryFn: async (): Promise<NavigationResult> => {
      const result = await getNavigationPath(officeId!);
      setNavigation(result);
      return result;
    },
    enabled: Boolean(officeId),
  });
}
