import { useCampusSearch } from "./useCampusQueries";

export function useSearch() {
  const mutation = useCampusSearch();

  return {
    search: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}

export { useCampusSearch, useNavigationPath, campusQueryKeys } from "./useCampusQueries";
