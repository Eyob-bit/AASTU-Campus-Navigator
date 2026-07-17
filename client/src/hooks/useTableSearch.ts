import { useState } from "react";

interface UseTableSearchOptions {
  onSearchChange?: (q: string) => void;
}

interface UseTableSearchReturn {
  search:    string;
  setSearch: (q: string) => void;
}

/**
 * Manages the search/filter query string for admin CRUD tables.
 * Accepts an optional callback to react to search input changes (e.g. reset page to 1).
 */
export function useTableSearch(options?: UseTableSearchOptions): UseTableSearchReturn {
  const [search, setSearchState] = useState("");

  const setSearch = (q: string) => {
    setSearchState(q);
    options?.onSearchChange?.(q);
  };

  return { search, setSearch };
}
