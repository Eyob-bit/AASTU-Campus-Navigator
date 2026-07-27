import { useCallback, useState } from "react";
import { searchCampus } from "@/services";
import { ApiRequestError } from "@/types";
import { useAppStore } from "@/store";

export function useSearch() {
  const { setSearchQuery, setSearchResults } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      setSearchQuery(trimmed);
      setError(null);

      if (trimmed.length < 2) {
        setSearchResults([]);
        setError("Enter at least 2 characters to search.");
        return [];
      }

      setIsLoading(true);

      try {
        const results = await searchCampus(trimmed);
        setSearchResults(results);
        return results;
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Search failed. Please try again.";
        setSearchResults([]);
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [setSearchQuery, setSearchResults]
  );

  return { search, isLoading, error };
}
