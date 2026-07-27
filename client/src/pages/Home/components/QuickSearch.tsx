import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";

const EXAMPLE_CHIPS = [
  "Library",
  "Main Building",
  "Registrar",
  "Student Affairs",
  "Cafeteria",
  "Computer Lab",
  "Administrative Block",
];

export function QuickSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/search");
    }
  };

  const handleChipClick = (chip: string) => {
    navigate(`/search?q=${encodeURIComponent(chip)}`);
  };

  return (
    <section
      className="bg-white py-20 dark:bg-slate-950"
      aria-labelledby="quick-search-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="animate-fade-in-up mb-8 text-center">
          <span className="mb-3 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
            Quick Search
          </span>
          <h2
            id="quick-search-heading"
            className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
          >
            Find anything on campus
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-slate-500 dark:text-slate-400">
            Search by building name, staff member, department, or service.
            Results appear instantly.
          </p>
        </div>

        {/* Search form */}
        <form
          onSubmit={handleSubmit}
          className="animate-fade-in-up delay-150"
          role="search"
          aria-label="Campus quick search"
        >
          <div className="group relative flex items-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm transition-all duration-200 focus-within:border-blue-500 focus-within:shadow-lg focus-within:shadow-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-blue-500">
            {/* Search icon */}
            <div className="pointer-events-none flex items-center pl-5">
              <Search
                className="h-5 w-5 text-slate-400 transition-colors duration-200 group-focus-within:text-blue-500"
                strokeWidth={2}
              />
            </div>

            {/* Input */}
            <input
              id="quick-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search buildings, offices, staff…"
              className="flex-1 bg-transparent px-4 py-4 text-base text-slate-900 placeholder-slate-400 outline-none dark:text-white"
              aria-label="Search campus"
              autoComplete="off"
            />

            {/* Submit button */}
            <button
              id="quick-search-submit-btn"
              type="submit"
              className="m-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-600/30 active:scale-100"
              aria-label="Search campus"
            >
              Search
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </form>

        {/* Example chips */}
        <div
          className="animate-fade-in-up delay-300 mt-6 flex flex-wrap items-center justify-center gap-2"
          aria-label="Popular searches"
        >
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Try:
          </span>
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip}
              id={`search-chip-${chip.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => handleChipClick(chip)}
              type="button"
              className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-blue-700 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
