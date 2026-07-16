import { Link } from "react-router-dom";
import { useAppStore } from "@/store";
import type { SearchResult } from "@/types";

interface SearchResultsProps {
  results: SearchResult[];
}

export function SearchResults({ results }: SearchResultsProps) {
  const { setSelectedResult } = useAppStore();

  if (results.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-3">
      {results.map((result) => {
        const title =
          result.type === "staff" && result.staff
            ? result.staff.fullName
            : result.office.name;
        const subtitle =
          result.type === "staff" && result.staff
            ? `${result.staff.position} · ${result.office.name}`
            : `Room ${result.office.roomNumber} · ${result.building.name}`;

        return (
          <li
            key={`${result.type}-${result.office.id}-${result.staff?.id ?? "office"}`}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{title}</p>
                <p className="text-sm text-slate-600">{subtitle}</p>
              </div>
              <Link
                to={`/navigation?officeId=${result.office.id}`}
                onClick={() => setSelectedResult(result)}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Navigate
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
