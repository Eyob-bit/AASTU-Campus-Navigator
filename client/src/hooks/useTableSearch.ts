import { useState } from "react";

interface UseTableSearchReturn {
  search:    string;
  setSearch: (q: string) => void;
}

/**
 * Manages the search/filter query string for admin CRUD tables.
 */
export function useTableSearch(): UseTableSearchReturn {
  const [search, setSearchState] = useState("");

  const setSearch = (q: string) => {
    setSearchState(q);
  };

  return { search, setSearch };
}
