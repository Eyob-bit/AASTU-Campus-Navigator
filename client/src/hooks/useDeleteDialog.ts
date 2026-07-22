import { useState } from "react";

interface UseDeleteDialogReturn<T> {
  deleteTarget: T | null;
  deleting:     boolean;
  setDeleting:  (v: boolean) => void;
  openDelete:   (item: T) => void;
  closeDelete:  () => void;
}

/**
 * Manages the state for a delete confirmation dialog.
 *
 * Single responsibility: tracks *which item* is targeted for deletion and
 * whether the async delete operation is currently in flight.
 *
 * The actual delete handler (API call, toast message, post-delete cleanup)
 * intentionally stays inside the page component, because every entity has
 * a different API, toast wording, and cleanup step.
 */
export function useDeleteDialog<T>(): UseDeleteDialogReturn<T> {
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  return {
    deleteTarget,
    deleting,
    setDeleting,
    openDelete:  (item: T) => setDeleteTarget(item),
    closeDelete: ()         => setDeleteTarget(null),
  };
}
