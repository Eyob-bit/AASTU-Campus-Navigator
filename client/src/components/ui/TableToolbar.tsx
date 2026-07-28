import { Search, Filter, SortAsc, RefreshCw, Download, Plus } from "lucide-react";
import { Button } from "./Button";

interface TableToolbarProps {
  search: string;
  setSearch: (v: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  onRefresh?: () => void;
}

export function TableToolbar({ search, setSearch, onAdd, addLabel, onRefresh }: TableToolbarProps) {
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-gray-100">
      <div className="relative w-full sm:w-auto flex-1 max-w-full sm:max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
        <Button variant="outline" size="sm">
          <Filter size={14} />Filter
        </Button>
        <Button variant="outline" size="sm">
          <SortAsc size={14} />Sort
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw size={14} />
          </Button>
          <Button variant="outline" size="sm">
            <Download size={14} />Export
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
