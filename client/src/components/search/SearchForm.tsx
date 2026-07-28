import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useCampusSearch } from "@/hooks";
import { searchSchema, type SearchFormValues } from "@/schemas/search.schema";
import { useAppStore } from "@/store";
import { searchApi } from "@/api/search.api";
import { SearchResults } from "./SearchResults";
import { LandmarkSearchResults } from "./LandmarkSearchResults";
import type { Landmark } from "@/types";

export function SearchForm() {
  const { searchResults } = useAppStore();
  const searchMutation = useCampusSearch();

  const [landmarkResults, setLandmarkResults] = useState<Landmark[]>([]);
  const [landmarkLoading, setLandmarkLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: "" },
  });

  const onSubmit = handleSubmit(async ({ query }: SearchFormValues) => {
    // Run both searches in parallel; office/staff search throws on 404
    setLandmarkResults([]);

    const [, ] = await Promise.allSettled([
      searchMutation.mutateAsync(query),
      (async () => {
        setLandmarkLoading(true);
        try {
          const results = await searchApi.searchLandmarks(query);
          setLandmarkResults(results ?? []);
        } finally {
          setLandmarkLoading(false);
        }
      })(),
    ]);
  });

  const hasOfficeResults = searchResults.length > 0;
  const hasLandmarkResults = landmarkResults.length > 0;
  const nothingFound =
    !searchMutation.isPending &&
    !landmarkLoading &&
    searchMutation.isError &&
    !hasLandmarkResults;

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="search-query" className="sr-only">Search campus</label>
          <input
            id="search-query"
            type="search"
            placeholder="Search buildings, offices, staff, landmarks…"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-blue-600 focus:ring-2"
            {...register("query")}
          />
          {errors.query ? <p className="mt-2 text-sm text-red-600">{errors.query.message}</p> : null}
        </div>
        <button
          type="submit"
          disabled={searchMutation.isPending || landmarkLoading}
          className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {searchMutation.isPending || landmarkLoading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Office / Staff results */}
      {hasOfficeResults && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Offices & Staff
          </p>
          <SearchResults results={searchResults} />
        </div>
      )}

      {/* Landmark results */}
      {hasLandmarkResults && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Campus Landmarks
          </p>
          <LandmarkSearchResults landmarks={landmarkResults} />
        </div>
      )}

      {/* Not found message */}
      {nothingFound && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No results found. Try a different search term.
        </p>
      )}
    </div>
  );
}
