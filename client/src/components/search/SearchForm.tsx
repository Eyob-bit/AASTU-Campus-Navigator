import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useCampusSearch } from "@/hooks";
import { searchSchema, type SearchFormValues } from "@/schemas/search.schema";
import { useAppStore } from "@/store";
import { SearchResults } from "./SearchResults";

export function SearchForm() {
  const { searchResults } = useAppStore();
  const searchMutation = useCampusSearch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: "",
    },
  });

  const onSubmit = handleSubmit(async ({ query }: SearchFormValues) => {
    await searchMutation.mutateAsync(query);
  });

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="search-query" className="sr-only">
            Search campus
          </label>
          <input
            id="search-query"
            type="search"
            placeholder="Search offices, rooms, staff, or aliases"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-blue-600 focus:ring-2"
            {...register("query")}
          />
          {errors.query ? (
            <p className="mt-2 text-sm text-red-600">{errors.query.message}</p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={searchMutation.isPending}
          className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {searchMutation.isPending ? "Searching..." : "Search"}
        </button>
      </form>

      {searchMutation.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchMutation.error.message}
        </p>
      ) : null}

      <SearchResults results={searchResults} />
    </div>
  );
}
