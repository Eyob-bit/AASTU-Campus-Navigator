import { useState, useEffect } from "react";

interface UsePaginationReturn {
  page:    number;
  setPage: (p: number) => void;
}

/**
 * Manages the current page number for admin CRUD tables.
 *
 * - Clamps to `totalPages` when the list shrinks (e.g. after a delete).
 */
export function usePagination(totalPages: number): UsePaginationReturn {
  const [page, setPage] = useState(1);

  // Clamp page when totalPages shrinks (e.g. last item on a page is deleted)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return { page, setPage };
}
