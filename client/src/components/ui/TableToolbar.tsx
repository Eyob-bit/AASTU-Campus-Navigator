import { useState, useRef, useEffect } from "react";
import { Search, Filter, RefreshCw, Plus, ChevronDown, ArrowUpDown, X } from "lucide-react";
import { Button } from "./Button";

export interface FilterOption {
  label: string;
  value: string;
}

export interface SortOption {
  label: string;
  value: string;
}

interface TableToolbarProps {
  search: string;
  setSearch: (v: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  onRefresh?: () => void;
  filterOptions?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
  sortOptions?: SortOption[];
  activeSort?: string;
  onSortChange?: (value: string) => void;
}

function Dropdown({
  trigger,
  children,
  align = "left",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className={`absolute z-50 mt-1 min-w-[160px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function TableToolbar({
  search,
  setSearch,
  onAdd,
  addLabel,
  onRefresh,
  filterOptions,
  activeFilter,
  onFilterChange,
  sortOptions,
  activeSort,
  onSortChange,
}: TableToolbarProps) {
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-gray-100 dark:border-slate-800">
      <div className="relative w-full sm:w-auto flex-1 max-w-full sm:max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
        />
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
        {filterOptions && filterOptions.length > 0 && (
          <Dropdown
            trigger={
              <Button
                variant={activeFilter ? "primary" : "outline"}
                size="sm"
                className={activeFilter ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800" : ""}
              >
                <Filter size={14} />
                {activeFilter ? filterOptions.find((f) => f.value === activeFilter)?.label || "Filter" : "Filter"}
                <ChevronDown size={12} />
              </Button>
            }
          >
            <button
              onClick={() => onFilterChange?.("")}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${
                !activeFilter ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-slate-300"
              }`}
            >
              All
            </button>
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onFilterChange?.(opt.value)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${
                  activeFilter === opt.value ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </Dropdown>
        )}

        {sortOptions && sortOptions.length > 0 && (
          <Dropdown
            trigger={
              <Button
                variant={activeSort ? "primary" : "outline"}
                size="sm"
                className={activeSort ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800" : ""}
              >
                <ArrowUpDown size={14} />
                {activeSort ? sortOptions.find((s) => s.value === activeSort)?.label || "Sort" : "Sort"}
                <ChevronDown size={12} />
              </Button>
            }
          >
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSortChange?.(activeSort === opt.value ? "" : opt.value)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${
                  activeSort === opt.value ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-slate-300"
                }`}
              >
                {opt.label}
                {activeSort === opt.value && <span className="ml-1 text-blue-400">✓</span>}
              </button>
            ))}
          </Dropdown>
        )}

        {activeFilter && onFilterChange && (
          <button
            onClick={() => onFilterChange("")}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
          >
            <X size={12} /> Clear filter
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw size={14} />
          </Button>
          {onAdd && (
            <Button variant="primary" size="sm" onClick={onAdd}>
              <Plus size={14} />{addLabel ?? "Add"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
