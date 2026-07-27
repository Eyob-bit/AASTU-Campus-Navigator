import { useEffect } from "react";

/**
 * A hook that resets the current page to 1 whenever the search query changes.
 * Used in administrative CRUD tables to prevent page overflow when filtering results.
 */
export function useResetPageOnSearch(search: string, setPage: (p: number) => void) {
  useEffect(() => {
    setPage(1);
  }, [search, setPage]);
}
