import { useState } from "react";

interface UseTableSearchReturn {
  search:    string;
  setSearch: (q: string) => void;
}

/**
 * Manages the search/filter query string for admin CRUD tables.
 * Single responsibility: owns the search string and nothing else.
 */
export function useTableSearch(): UseTableSearchReturn {
  const [search, setSearch] = useState("");
  return { search, setSearch };
}
